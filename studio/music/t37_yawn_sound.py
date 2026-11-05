import numpy as np, wave
from scipy.signal import lfilter, butter
sr=44100; rng=np.random.default_rng(7)
def formant(x,f,bw):
    r=np.exp(-np.pi*bw/sr); th=2*np.pi*f/sr
    return lfilter([1-r],[1,-2*r*np.cos(th),r*r],x)
# in-breath: 1.1 s of soft noise with rising colour
n1=int(1.15*sr); t=np.arange(n1)/sr
nz=rng.standard_normal(n1)
inb=formant(nz,900,700)+0.5*formant(nz,2200,900)
env=np.sin(np.pi*np.clip(t/1.15,0,1))**1.2
inb=inb*env*0.5
# out-breath: 1.6 s, voiced, falling pitch + falling first formant, breath on top
n2=int(1.7*sr); t2=np.arange(n2)/sr
f0=np.interp(t2,[0,.25,1.7],[265,290,150])
ph=np.cumsum(f0)/sr
src=2*(ph%1)-1
src=lfilter([1],[1,-0.9],src)
nz2=rng.standard_normal(n2)
exc=src*0.5+nz2*0.28
# time-varying formants in small blocks
out=np.zeros(n2); bs=512
for k in range(0,n2,bs):
    tt=k/sr
    f1=np.interp(tt,[0,1.7],[820,520]); f2=np.interp(tt,[0,1.7],[1250,950])
    seg=exc[k:k+bs]
    a=formant(seg,f1,120)+0.6*formant(seg,f2,160)+0.25*formant(seg,2700,250)
    out[k:k+len(seg)]=a
env2=np.interp(t2,[0,.15,1.0,1.7],[0,1,.6,0])
out=out*env2
gap=np.zeros(int(.05*sr))
x=np.concatenate([inb/np.abs(inb).max()*.45,gap,out/np.abs(out).max()*.8])
# gentle low-pass
b,a=butter(2,5500/(sr/2)); x=lfilter(b,a,x)
x=x/np.abs(x).max()*.8
xx=np.stack([x,x],1)
w=wave.open('studio/public/t37-yawn-test/yawn.wav','wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(sr); w.writeframes((xx*32767).astype('<i2').tobytes()); w.close(); print(len(x)/sr)
