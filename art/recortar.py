import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage
"""Quita el fondo de los personajes (art/source) y deja PNG recortados en art/out.
Después se pasan a src/games/duelo/art/<ID>.webp a 1000 px de alto."""
import os
SRC=os.path.join(os.path.dirname(__file__),'source')+'/'
OUT=os.path.join(os.path.dirname(__file__),'out')+'/'
os.makedirs(OUT,exist_ok=True)
def cut(f, dark, out):
    a=np.array(Image.open(SRC+f).convert('RGB')).astype(int)
    mx=a.max(2); mn=a.min(2)
    if dark: cand = mx <= 2
    else: cand = (mn >= 205) & (mx-mn <= 18)
    lab,_=ndimage.label(cand)
    border=set(np.unique(np.concatenate([lab[0],lab[-1],lab[:,0],lab[:,-1]])))-{0}
    bg=np.isin(lab,list(border))
    fg=~bg
    # quitar islas pequeñas y rellenar huecos interiores pequeños
    fg=ndimage.binary_opening(fg,iterations=1)
    lab2,n=ndimage.label(fg); sizes=ndimage.sum(fg,lab2,range(1,n+1))
    fg=np.isin(lab2,[i+1 for i,v in enumerate(sizes) if v>3000])
    fg=ndimage.binary_fill_holes(fg) if dark else fg
    alpha=Image.fromarray((fg*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2))
    im=Image.fromarray(a.astype(np.uint8)).convert('RGBA'); im.putalpha(alpha)
    bb=im.getbbox(); im=im.crop(bb)
    im.save(OUT+out+'.png')
    prev=Image.new('RGBA',im.size,(255,0,255,255)); prev.alpha_composite(im); 
    print(out, im.size)
cut('iberru.webp',False,'IBE'); cut('macaco.webp',False,'MAC'); cut('andy.webp',True,'AND')
