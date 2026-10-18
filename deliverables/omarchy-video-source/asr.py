import sherpa_onnx, wave, numpy as np, json, sys, time
M = "sherpa-onnx-streaming-zipformer-ar_en_id_ja_ru_th_vi_zh-2025-02-10/"
rec = sherpa_onnx.OnlineRecognizer.from_transducer(
    tokens=M+"tokens.txt", encoder=M+"encoder-epoch-75-avg-11-chunk-16-left-128.int8.onnx",
    decoder=M+"decoder-epoch-75-avg-11-chunk-16-left-128.onnx", joiner=M+"joiner-epoch-75-avg-11-chunk-16-left-128.int8.onnx",
    num_threads=4, sample_rate=16000, feature_dim=80, decoding_method="greedy_search", enable_endpoint_detection=False)
src = sys.argv[1]
import subprocess
subprocess.run(["ffmpeg","-v","error","-y","-i",src,"-ar","16000","-ac","1","tmp16.wav"],check=True)
w = wave.open("tmp16.wav"); n = w.getnframes(); x = np.frombuffer(w.readframes(n), dtype=np.int16).astype(np.float32)/32768; w.close()
t0 = time.time()
s = rec.create_stream()
tokens = []; chunk = 16000*10
out_tokens = []; out_ts = []
step = 3200
pos = 0
while pos < len(x):
    s.accept_waveform(16000, x[pos:pos+step]); pos += step
    while rec.is_ready(s): rec.decode_stream(s)
s.accept_waveform(16000, np.zeros(16000*1, dtype=np.float32)); s.input_finished()
while rec.is_ready(s): rec.decode_stream(s)
r = rec.get_result_all(s) if hasattr(rec,'get_result_all') else rec.get_result(s)
print("elapsed", round(time.time()-t0,1))
try:
    toks = r.tokens; ts = r.timestamps; text = r.text
except AttributeError:
    toks = r["tokens"]; ts = r["timestamps"]; text = r["text"]
json.dump({"tokens": list(toks), "timestamps": [float(t) for t in ts], "text": text}, open(sys.argv[2], "w"), ensure_ascii=False)
print(len(toks), "tokens;", text[:300])
