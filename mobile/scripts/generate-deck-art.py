"""Author original, language-neutral fixture PNGs (optional tool: Python + Pillow)."""
from pathlib import Path
from math import cos, sin, pi
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent / 'assets' / 'decks'
W, H = 600, 900
GOLD, INK, PAPER = '#bb9957', '#28554a', '#f4f0e4'

def star(cx, cy, outer, inner, points=8):
    return [(cx + (outer if i % 2 == 0 else inner) * cos(-pi/2 + i*pi/points),
             cy + (outer if i % 2 == 0 else inner) * sin(-pi/2 + i*pi/points)) for i in range(points*2)]

def garden(kind):
    image = Image.new('RGB', (W, H), PAPER)
    d = ImageDraw.Draw(image)
    d.rounded_rectangle((17,17,582,882), radius=30, fill=INK)
    d.rounded_rectangle((31,31,568,868), radius=22, fill=PAPER, outline=GOLD, width=3)
    d.ellipse((112,202,488,578), fill='#e3e7d6')
    d.arc((91,181,509,599), 210, 330, fill=GOLD, width=3)
    d.arc((91,181,509,599), 30, 150, fill=GOLD, width=3)
    d.line((154,720,446,720), fill=GOLD, width=3)
    for x in [270,300,330]: d.ellipse((x-4,754,x+4,762), fill=GOLD)
    d.polygon(star(300,125,15,5,4), fill=GOLD)
    if kind == 'seed':
        d.arc((220,400,380,590),180,360,fill=INK,width=8)
        d.line((300,530,300,350),fill=INK,width=10)
        d.ellipse((220,330,300,405),fill=INK)
        d.ellipse((305,295,385,370),fill=INK)
        d.line((180,552,420,552),fill=INK,width=5)
    elif kind == 'spring':
        for y,half in [(430,60),(478,105),(526,145)]:
            d.arc((300-half,y-28,300+half,y+28),0,180,fill=INK,width=7)
        d.polygon([(300,270),(257,355),(263,386),(285,401),(315,401),(337,386),(343,355)],fill=INK)
        d.ellipse((282,350,295,375),fill='#91ac95')
    elif kind == 'path':
        d.polygon([(205,600),(395,600),(337,492),(350,430),(312,368),(318,292),(296,292),(288,385),(316,438),(278,495)],fill=INK)
        d.line([(300,570),(300,524),(319,481)],fill=GOLD,width=5)
        for x,y in [(187,380),(404,342),(192,506),(428,512)]: d.ellipse((x-9,y-9,x+9,y+9),fill=GOLD)
    elif kind == 'lantern':
        d.arc((257,260,343,356),180,360,fill=INK,width=10)
        d.polygon([(235,355),(365,355),(386,520),(214,520)],fill=INK)
        d.polygon([(258,375),(342,375),(355,496),(245,496)],fill='#dcc176')
        d.line((300,355,300,520),fill=INK,width=7)
        d.rounded_rectangle((211,519,389,540),radius=8,fill=INK)
        for a,b in [((180,412),(155,412)),((420,412),(445,412)),((212,310),(193,291)),((388,310),(407,291))]: d.line((a,b),fill=GOLD,width=5)
    elif kind == 'bridge':
        d.arc((150,335,450,615),180,360,fill=INK,width=34)
        d.arc((150,300,450,580),180,360,fill=INK,width=6)
        d.line((155,440,155,550),fill=INK,width=7); d.line((445,440,445,550),fill=INK,width=7)
        for x,y in [(210,380),(260,347),(340,347),(390,380)]: d.line((x,y-35,x,y),fill=INK,width=6)
        d.arc((170,515,430,565),0,180,fill=GOLD,width=5)
        d.arc((200,550,400,588),0,180,fill=GOLD,width=4)
    elif kind == 'tree':
        d.rounded_rectangle((288,382,312,578),radius=5,fill=INK)
        for x,y,r in [(240,380,65),(360,380,65),(270,310,70),(330,310,70),(300,266,55)]: d.ellipse((x-r,y-r,x+r,y+r),fill=INK)
        d.line((300,443,254,388),fill=GOLD,width=5); d.line((300,465,350,405),fill=GOLD,width=5)
        d.line((300,574,250,606),fill=INK,width=7); d.line((300,574,350,606),fill=INK,width=7)
    elif kind == 'star':
        d.polygon(star(300,395,144,49,8),fill=INK)
        d.polygon(star(300,395,81,30,8),fill=GOLD)
        for x,y in [(200,260),(410,275),(180,525),(409,529)]: d.polygon(star(x,y,15,5,4),fill=GOLD)
    elif kind == 'circle':
        d.ellipse((179,274,421,516),outline=INK,width=25)
        d.ellipse((213,308,387,482),outline=GOLD,width=3)
        for angle in range(0,360,45):
            x,y=300+158*cos(angle*pi/180),395+158*sin(angle*pi/180)
            d.ellipse((x-5,y-5,x+5,y+5),fill=GOLD)
    elif kind == 'back':
        d.rounded_rectangle((31,31,568,868),radius=22,fill=INK,outline=GOLD,width=3)
        for y in range(75,860,55):
            for x in range(75,560,55): d.polygon(star(x,y,5,2,4),fill='#608071')
        d.ellipse((143,293,457,607),fill=INK,outline=GOLD,width=4)
        d.ellipse((165,315,435,585),outline=GOLD,width=2)
        d.polygon(star(300,450,104,39,8),fill=GOLD)
        d.ellipse((283,433,317,467),fill=INK)
    return image

def motion(kind):
    image = Image.new('RGB',(W,H),'#251f40'); d=ImageDraw.Draw(image)
    d.rounded_rectangle((19,19,580,880),radius=35,outline='#fa9a78',width=5)
    d.rounded_rectangle((35,35,564,864),radius=25,outline='#81749e',width=2)
    d.ellipse((90,240,510,660),fill='#3c305b')
    if kind=='spark':
        d.polygon(star(300,450,177,58,6),fill='#fa9a78')
        d.polygon(star(300,450,83,26,6),fill='#ffe1a3')
    elif kind=='wave':
        for i,color in [(0,'#fa9a78'),(1,'#ffe1a3'),(2,'#b4cbd7')]:
            y=345+i*85
            d.arc((130,y-70,300,y+70),180,360,fill=color,width=24)
            d.arc((300,y-70,470,y+70),0,180,fill=color,width=24)
    elif kind=='mountain':
        d.polygon([(110,595),(300,295),(490,595)],fill='#fa9a78')
        d.polygon([(300,295),(220,422),(300,392),(380,422)],fill='#ffe1a3')
        d.polygon([(300,392),(300,595),(490,595)],fill='#bc6c78')
    elif kind=='back':
        for y in range(120,820,110):
            for x in range(130,510,110): d.polygon([(x,y-32),(x+32,y),(x,y+32),(x-32,y)],outline='#81749e',width=3)
        d.polygon([(300,270),(470,450),(300,630),(130,450)],fill='#251f40',outline='#fa9a78',width=5)
        d.ellipse((235,385,365,515),fill='#fa9a78')
        d.ellipse((271,421,329,479),fill='#251f40')
    d.line((205,770,395,770),fill='#fa9a78',width=4)
    return image

if __name__ == '__main__':
    for deck,kinds,render in [('sample',['back','seed','spring','path','lantern','bridge','tree','star','circle'],garden),('alternate',['back','spark','wave','mountain'],motion)]:
        folder=ROOT/deck; folder.mkdir(parents=True,exist_ok=True)
        for kind in kinds: render(kind).save(folder/f'{kind}.png',optimize=True)
    print('Authored 13 original 600×900 PNG assets.')
