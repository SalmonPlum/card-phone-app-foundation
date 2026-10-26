import type { DeckManifest } from '../domain/contracts.ts';

export const sampleDeck = {
  "schemaVersion": 1,
  "id": "sample",
  "version": "1.0.0",
  "name": {
    "cs": "Tichá zahrada",
    "en": "Quiet Garden"
  },
  "backAsset": "sample.back",
  "cards": [
    {
      "id": 0,
      "faceAsset": "sample.seed",
      "translations": {
        "cs": {
          "name": "Semínko",
          "meaning": "Malý začátek, který potřebuje péči.",
          "description": "Semínko připomíná, že nový záměr nemusí být hned vidět. Dejte mu prostor a zvolte jeden malý krok, který dnes dokážete udělat.\n\nVšímejte si podmínek, ve kterých se vám dobře roste. Trpělivost a pravidelná péče mohou být užitečnější než spěch."
        },
        "en": {
          "name": "Seed",
          "meaning": "A small beginning that needs care.",
          "description": "The seed is a reminder that a new intention may not be visible yet. Give it room and choose one small step you can take today.\n\nNotice the conditions that help you grow. Patience and steady care may serve you better than rushing."
        }
      }
    },
    {
      "id": 7,
      "faceAsset": "sample.spring",
      "translations": {
        "cs": {
          "name": "Pramen",
          "meaning": "Obnova sil a návrat k tomu, co vás živí.",
          "description": "Pramen nabízí chvíli zastavení. Zeptejte se, odkud čerpáte energii a co ji v poslední době zbytečně odvádí.\n\nObnova může být prostá: napít se, odpočinout si nebo věnovat pozornost něčemu příjemnému. Vyberte si vlastní způsob, jak doplnit síly."
        },
        "en": {
          "name": "Spring",
          "meaning": "Renewal and a return to what sustains you.",
          "description": "The spring offers a moment to pause. Ask where your energy comes from and what has been draining it lately.\n\nRenewal can be simple: a drink of water, some rest, or attention to something enjoyable. Choose your own way to replenish your strength."
        }
      }
    },
    {
      "id": 12,
      "faceAsset": "sample.path",
      "translations": {
        "cs": {
          "name": "Cesta",
          "meaning": "Další krok se může ukázat až za chůze.",
          "description": "Cesta nemusí být přímá, aby někam vedla. Podívejte se na možnosti před sebou a vyberte směr, který vám nyní dává smysl.\n\nNemusíte znát celou trasu. Průběžně si ověřujte, zda vám zvolený směr vyhovuje, a dovolte si ho upravit."
        },
        "en": {
          "name": "Path",
          "meaning": "The next step may become clear as you move.",
          "description": "A path does not have to be straight to lead somewhere. Look at the possibilities ahead and choose a direction that makes sense to you now.\n\nYou do not need to know the whole route. Check along the way whether the direction still suits you, and allow yourself to adjust it."
        }
      }
    },
    {
      "id": 23,
      "faceAsset": "sample.lantern",
      "translations": {
        "cs": {
          "name": "Lucerna",
          "meaning": "Jasná pozornost věnovaná nejbližšímu okolí.",
          "description": "Lucerna osvětluje malý okruh, nikoli celý svět. Zaměřte se na to, co můžete právě teď uvidět, pojmenovat a ovlivnit.\n\nJasnost může přijít z jednoduché otázky nebo klidného rozhovoru. Dejte pozornost jedné věci a ostatním dovolte chvíli počkat."
        },
        "en": {
          "name": "Lantern",
          "meaning": "Clear attention to what is close at hand.",
          "description": "A lantern lights a small circle rather than the whole world. Focus on what you can see, name, and influence right now.\n\nClarity may come from a simple question or a quiet conversation. Give your attention to one thing and let the others wait for a moment."
        }
      }
    },
    {
      "id": 35,
      "faceAsset": "sample.bridge",
      "translations": {
        "cs": {
          "name": "Most",
          "meaning": "Propojení dvou břehů a ochota naslouchat.",
          "description": "Most zve k hledání spojení tam, kde se pohledy liší. Co máte s druhým člověkem nebo s novou situací společného?\n\nPrvním prknem může být laskavá otázka, srozumitelná prosba nebo pojmenování hranice. Spojení má být bezpečné pro obě strany."
        },
        "en": {
          "name": "Bridge",
          "meaning": "Connection between two shores and a willingness to listen.",
          "description": "The bridge invites you to seek connection where perspectives differ. What do you share with another person or with a new situation?\n\nThe first plank might be a kind question, a clear request, or an expressed boundary. Connection should feel safe on both sides."
        }
      }
    },
    {
      "id": 48,
      "faceAsset": "sample.tree",
      "translations": {
        "cs": {
          "name": "Strom",
          "meaning": "Pevné kořeny a prostor pro nový růst.",
          "description": "Strom připomíná oporu, kterou už máte: zkušenosti, vztahy i drobné každodenní návyky. Vraťte se k tomu, co vás drží při zemi.\n\nVedle kořenů potřebují prostor také větve. Zvažte, čemu chcete dát více místa a co už nemusíte dál nést."
        },
        "en": {
          "name": "Tree",
          "meaning": "Steady roots and room for new growth.",
          "description": "The tree recalls the support you already have: experience, relationships, and small daily habits. Return to what keeps you grounded.\n\nBranches need space as well as roots. Consider what you want to make more room for and what you no longer need to carry."
        }
      }
    },
    {
      "id": 64,
      "faceAsset": "sample.star",
      "translations": {
        "cs": {
          "name": "Hvězda",
          "meaning": "Tichá připomínka směru, který je pro vás důležitý.",
          "description": "Hvězda může být vzdálená, a přesto pomáhá s orientací. Vybavte si hodnotu nebo přání, ke kterému se chcete vracet.\n\nNejde o jistotu budoucího výsledku. Jde o malý orientační bod, podle kterého můžete posoudit své další rozhodnutí."
        },
        "en": {
          "name": "Star",
          "meaning": "A quiet reminder of a direction that matters to you.",
          "description": "A star may be distant and still help you find your bearings. Recall a value or wish you want to return to.\n\nThis is not a promise of a future outcome. It is a small point of reference you can use when considering your next decision."
        }
      }
    },
    {
      "id": 99,
      "faceAsset": "sample.circle",
      "translations": {
        "cs": {
          "name": "Kruh",
          "meaning": "Uzavření jedné etapy a přijetí celku.",
          "description": "Kruh nabízí pohled na celek. Co se podařilo, co zůstává otevřené a co si z této zkušenosti chcete odnést?\n\nDokončení nemusí být dokonalé. Může stačit poděkovat za vykonanou práci, uznat své úsilí a uvolnit místo dalšímu začátku."
        },
        "en": {
          "name": "Circle",
          "meaning": "Completing one stage and acknowledging the whole.",
          "description": "The circle offers a view of the whole. What went well, what remains open, and what do you want to take from this experience?\n\nCompletion does not have to be perfect. It may be enough to appreciate the work, acknowledge your effort, and make room for another beginning."
        }
      }
    }
  ]
} satisfies DeckManifest;
