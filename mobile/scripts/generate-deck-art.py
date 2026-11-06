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
    elif kind == 'moon':
        d.ellipse((202,278,398,474),fill=INK)
        d.ellipse((252,250,426,424),fill='#e3e7d6')
        for x,y,r in [(207,495,13),(387,487,18),(190,313,10)]:
            d.polygon(star(x,y,r,4,4),fill=GOLD)
    elif kind == 'sun':
        for a in range(0,360,30):
            angle=a*pi/180
            d.line((300+116*cos(angle),390+116*sin(angle),300+151*cos(angle),390+151*sin(angle)),fill=GOLD,width=8)
        d.ellipse((207,297,393,483),fill=INK)
        d.ellipse((224,314,376,466),outline=GOLD,width=3)
    elif kind == 'mountain':
        d.polygon([(137,552),(254,320),(338,450),(390,360),(469,552)],fill=INK)
        d.polygon([(254,320),(219,390),(253,373),(282,390)],fill=GOLD)
        d.line([(284,500),(326,450),(351,483),(390,360)],fill=GOLD,width=4)
    elif kind == 'river':
        points=[(300+66*sin(i*pi/45),262+i*3) for i in range(100)]
        d.line(points,fill=INK,width=38,joint='curve')
        d.line(points,fill=GOLD,width=4,joint='curve')
        for x,y in [(182,333),(411,433),(189,535)]:
            d.ellipse((x-14,y-9,x+14,y+9),outline=INK,width=3)
    elif kind == 'flower':
        d.line((300,390,300,568),fill=INK,width=9)
        d.ellipse((224,455,300,495),fill=INK)
        d.ellipse((304,480,382,520),fill=INK)
        for a in range(0,360,60):
            x,y=300+61*cos(a*pi/180),354+61*sin(a*pi/180)
            d.ellipse((x-38,y-38,x+38,y+38),fill=INK)
        d.ellipse((267,321,333,387),fill=GOLD)
    elif kind == 'feather':
        d.polygon([(237,522),(214,432),(235,350),(290,293),(370,260),(375,350),(345,445),(280,520)],fill=INK)
        d.line((222,570,357,286),fill=GOLD,width=7)
        for x,y in [(266,478),(286,434),(307,390),(328,346)]:
            d.line((x-32,y-43,x,y,x+40,y-9),fill=GOLD,width=3)
    elif kind == 'key':
        d.line((300,372,416,524),fill=INK,width=23)
        d.line((386,478,360,501),fill=INK,width=20)
        d.line((410,510,384,533),fill=INK,width=20)
        d.ellipse((202,272,336,406),fill=INK)
        d.ellipse((228,298,310,380),fill='#e3e7d6')
        d.ellipse((245,315,293,363),outline=GOLD,width=3)
    elif kind == 'gate':
        d.arc((192,248,408,450),180,360,fill=INK,width=12)
        d.line((198,348,198,555),fill=INK,width=12)
        d.line((402,348,402,555),fill=INK,width=12)
        d.polygon([(198,357),(261,390),(261,548),(198,526)],outline=INK,width=8)
        d.polygon([(402,357),(339,390),(339,548),(402,526)],outline=INK,width=8)
        d.ellipse((244,459,254,469),fill=GOLD)
        d.ellipse((346,459,356,469),fill=GOLD)
        d.line((275,563,325,563),fill=GOLD,width=4)
    elif kind == 'bench':
        for y in [337,375]: d.rounded_rectangle((182,y,418,y+22),radius=5,fill=INK)
        d.line((204,324,204,448),fill=INK,width=10)
        d.line((396,324,396,448),fill=INK,width=10)
        d.rounded_rectangle((169,427,431,451),radius=6,fill=INK)
        d.line((206,450,193,542),fill=INK,width=12)
        d.line((394,450,407,542),fill=INK,width=12)
        d.line((212,491,388,491),fill=GOLD,width=5)
    elif kind == 'pond':
        d.ellipse((145,337,455,525),outline=INK,width=12)
        d.ellipse((177,363,423,499),outline=GOLD,width=3)
        d.arc((205,396,383,468),12,167,fill=INK,width=4)
        d.pieslice((268,373,334,425),20,340,fill=INK)
        d.ellipse((302,330,318,349),fill=GOLD)
    elif kind == 'roots':
        d.line((178,350,422,350),fill=GOLD,width=4)
        d.line((300,268,300,416),fill=INK,width=13)
        for points in [[(300,404),(250,450),(227,528),(190,555)],[(300,404),(350,450),(373,528),(410,555)],[(300,414),(282,486),(300,563)],[(251,450),(200,476),(174,512)],[(349,450),(400,476),(426,512)]]:
            d.line(points,fill=INK,width=8,joint='curve')
        for x,y in [(227,528),(373,528),(282,486)]:
            d.ellipse((x-6,y-6,x+6,y+6),fill=GOLD)
    elif kind == 'dew':
        d.polygon([(206,462),(228,342),(320,286),(403,335),(373,456),(278,508)],fill=INK)
        d.line((229,484,372,321),fill=GOLD,width=4)
        for x,y,r in [(303,352,20),(270,420,13),(343,413,15)]:
            d.polygon([(x,y-r*2),(x-r,y),(x-r,y+r),(x,y+r*1.4),(x+r,y+r),(x+r,y)],fill=GOLD)
            d.ellipse((x-5,y-2,x+1,y+5),fill=PAPER)
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
    count = 0
    for deck,kinds,render in [('sample',['back','seed','spring','path','lantern','bridge','tree','star','circle','moon','sun','mountain','river','flower','feather','key','gate','bench','pond','roots','dew'],garden),('alternate',['back','spark','wave','mountain'],motion)]:
        folder=ROOT/deck; folder.mkdir(parents=True,exist_ok=True)
        for kind in kinds:
            render(kind).save(folder/f'{kind}.png',optimize=True)
            count += 1
    print(f'Authored {count} original 600×900 PNG assets.')
