import { sampleArtwork } from './sampleArtwork.ts';
import type { DeckManifest } from '../domain/contracts.ts';

export const sampleDeck = {
  "schemaVersion": 2,
  "id": "sample",
  "version": "1.2.0",
  "name": {
    "cs": "Tichá zahrada",
    "en": "Quiet Garden"
  },
  "backAsset": "sample.back",
  artwork: sampleArtwork,
  "cards": [
    {
      "id": 0,
      "faceAsset": "sample.seed",
      "translations": {
        "cs": {
          "name": "Semínko",
          "sections": {
            "meaning": "Malý začátek, který potřebuje péči.",
            "description": "Semínko připomíná, že nový záměr nemusí být hned vidět. Dejte mu prostor a zvolte jeden malý krok, který dnes dokážete udělat.\n\nVšímejte si podmínek, ve kterých se vám dobře roste. Trpělivost a pravidelná péče mohou být užitečnější než spěch."
          }
        },
        "en": {
          "name": "Seed",
          "sections": {
            "meaning": "A small beginning that needs care.",
            "description": "The seed is a reminder that a new intention may not be visible yet. Give it room and choose one small step you can take today.\n\nNotice the conditions that help you grow. Patience and steady care may serve you better than rushing."
          }
        }
      }
    },
    {
      "id": 7,
      "faceAsset": "sample.spring",
      "translations": {
        "cs": {
          "name": "Pramen",
          "sections": {
            "meaning": "Obnova sil a návrat k tomu, co vás živí.",
            "description": "Pramen nabízí chvíli zastavení. Zeptejte se, odkud čerpáte energii a co ji v poslední době zbytečně odvádí.\n\nObnova může být prostá: napít se, odpočinout si nebo věnovat pozornost něčemu příjemnému. Vyberte si vlastní způsob, jak doplnit síly."
          }
        },
        "en": {
          "name": "Spring",
          "sections": {
            "meaning": "Renewal and a return to what sustains you.",
            "description": "The spring offers a moment to pause. Ask where your energy comes from and what has been draining it lately.\n\nRenewal can be simple: a drink of water, some rest, or attention to something enjoyable. Choose your own way to replenish your strength."
          }
        }
      }
    },
    {
      "id": 12,
      "faceAsset": "sample.path",
      "translations": {
        "cs": {
          "name": "Cesta",
          "sections": {
            "meaning": "Další krok se může ukázat až za chůze.",
            "description": "Cesta nemusí být přímá, aby někam vedla. Podívejte se na možnosti před sebou a vyberte směr, který vám nyní dává smysl.\n\nNemusíte znát celou trasu. Průběžně si ověřujte, zda vám zvolený směr vyhovuje, a dovolte si ho upravit."
          }
        },
        "en": {
          "name": "Path",
          "sections": {
            "meaning": "The next step may become clear as you move.",
            "description": "A path does not have to be straight to lead somewhere. Look at the possibilities ahead and choose a direction that makes sense to you now.\n\nYou do not need to know the whole route. Check along the way whether the direction still suits you, and allow yourself to adjust it."
          }
        }
      }
    },
    {
      "id": 23,
      "faceAsset": "sample.lantern",
      "translations": {
        "cs": {
          "name": "Lucerna",
          "sections": {
            "meaning": "Jasná pozornost věnovaná nejbližšímu okolí.",
            "description": "Lucerna osvětluje malý okruh, nikoli celý svět. Zaměřte se na to, co můžete právě teď uvidět, pojmenovat a ovlivnit.\n\nJasnost může přijít z jednoduché otázky nebo klidného rozhovoru. Dejte pozornost jedné věci a ostatním dovolte chvíli počkat."
          }
        },
        "en": {
          "name": "Lantern",
          "sections": {
            "meaning": "Clear attention to what is close at hand.",
            "description": "A lantern lights a small circle rather than the whole world. Focus on what you can see, name, and influence right now.\n\nClarity may come from a simple question or a quiet conversation. Give your attention to one thing and let the others wait for a moment."
          }
        }
      }
    },
    {
      "id": 35,
      "faceAsset": "sample.bridge",
      "translations": {
        "cs": {
          "name": "Most",
          "sections": {
            "meaning": "Propojení dvou břehů a ochota naslouchat.",
            "description": "Most zve k hledání spojení tam, kde se pohledy liší. Co máte s druhým člověkem nebo s novou situací společného?\n\nPrvním prknem může být laskavá otázka, srozumitelná prosba nebo pojmenování hranice. Spojení má být bezpečné pro obě strany."
          }
        },
        "en": {
          "name": "Bridge",
          "sections": {
            "meaning": "Connection between two shores and a willingness to listen.",
            "description": "The bridge invites you to seek connection where perspectives differ. What do you share with another person or with a new situation?\n\nThe first plank might be a kind question, a clear request, or an expressed boundary. Connection should feel safe on both sides."
          }
        }
      }
    },
    {
      "id": 48,
      "faceAsset": "sample.tree",
      "translations": {
        "cs": {
          "name": "Strom",
          "sections": {
            "meaning": "Pevné kořeny a prostor pro nový růst.",
            "description": "Strom připomíná oporu, kterou už máte: zkušenosti, vztahy i drobné každodenní návyky. Vraťte se k tomu, co vás drží při zemi.\n\nVedle kořenů potřebují prostor také větve. Zvažte, čemu chcete dát více místa a co už nemusíte dál nést."
          }
        },
        "en": {
          "name": "Tree",
          "sections": {
            "meaning": "Steady roots and room for new growth.",
            "description": "The tree recalls the support you already have: experience, relationships, and small daily habits. Return to what keeps you grounded.\n\nBranches need space as well as roots. Consider what you want to make more room for and what you no longer need to carry."
          }
        }
      }
    },
    {
      "id": 64,
      "faceAsset": "sample.star",
      "translations": {
        "cs": {
          "name": "Hvězda",
          "sections": {
            "meaning": "Tichá připomínka směru, který je pro vás důležitý.",
            "description": "Hvězda může být vzdálená, a přesto pomáhá s orientací. Vybavte si hodnotu nebo přání, ke kterému se chcete vracet.\n\nNejde o jistotu budoucího výsledku. Jde o malý orientační bod, podle kterého můžete posoudit své další rozhodnutí."
          }
        },
        "en": {
          "name": "Star",
          "sections": {
            "meaning": "A quiet reminder of a direction that matters to you.",
            "description": "A star may be distant and still help you find your bearings. Recall a value or wish you want to return to.\n\nThis is not a promise of a future outcome. It is a small point of reference you can use when considering your next decision."
          }
        }
      }
    },
    {
      "id": 99,
      "faceAsset": "sample.circle",
      "translations": {
        "cs": {
          "name": "Kruh",
          "sections": {
            "meaning": "Uzavření jedné etapy a přijetí celku.",
            "description": "Kruh nabízí pohled na celek. Co se podařilo, co zůstává otevřené a co si z této zkušenosti chcete odnést?\n\nDokončení nemusí být dokonalé. Může stačit poděkovat za vykonanou práci, uznat své úsilí a uvolnit místo dalšímu začátku."
          }
        },
        "en": {
          "name": "Circle",
          "sections": {
            "meaning": "Completing one stage and acknowledging the whole.",
            "description": "The circle offers a view of the whole. What went well, what remains open, and what do you want to take from this experience?\n\nCompletion does not have to be perfect. It may be enough to appreciate the work, acknowledge your effort, and make room for another beginning."
          }
        }
      }
    },
    {
      "id": 104,
      "faceAsset": "sample.moon",
      "translations": {
        "cs": {
          "name": "Měsíc",
          "sections": {
            "meaning": "Prostor pro klid a pozornost k tomu, co se mění.",
            "description": "Měsíc připomíná, že ne každá chvíle potřebuje plné světlo. Dopřejte si čas vnímat i to, co ještě nedokážete přesně pojmenovat.\n\nProměnlivost nemusí znamenat ztrátu směru. Zkuste si všimnout jedné potřeby, která je dnes jiná než včera."
          }
        },
        "en": {
          "name": "Moon",
          "sections": {
            "meaning": "Room for stillness and attention to what is changing.",
            "description": "The moon is a reminder that not every moment needs full light. Allow time to notice what you cannot yet put into words.\n\nChange does not have to mean losing your direction. Notice one need that feels different today than it did yesterday."
          }
        }
      }
    },
    {
      "id": 118,
      "faceAsset": "sample.sun",
      "translations": {
        "cs": {
          "name": "Slunce",
          "sections": {
            "meaning": "Radost a odvaha dát svému úsilí prostor.",
            "description": "Slunce obrací pozornost k tomu, co vám přináší lehkost a chuť jednat. Připomeňte si drobný úspěch, který jste možná přehlédli.\n\nNemusíte být neustále výkonní. Vyberte si jednu činnost, která vám dnes přinese radost, a dopřejte si ji bez spěchu."
          }
        },
        "en": {
          "name": "Sun",
          "sections": {
            "meaning": "Joy and the courage to give your efforts room.",
            "description": "The sun draws attention to what brings you ease and a willingness to act. Recall a small success you may have overlooked.\n\nYou do not have to be productive all the time. Choose one activity that would bring you joy today and make room for it without rushing."
          }
        }
      }
    },
    {
      "id": 127,
      "faceAsset": "sample.mountain",
      "translations": {
        "cs": {
          "name": "Hora",
          "sections": {
            "meaning": "Odstup, vytrvalost a cesta rozdělená na menší kroky.",
            "description": "Hora může z dálky působit nedostupně. Podívejte se místo vrcholu na nejbližší úsek cesty a na oporu, kterou máte po ruce.\n\nVytrvalost zahrnuje také přestávky a změnu tempa. Co by vám pomohlo pokračovat způsobem, který je pro vás únosný?"
          }
        },
        "en": {
          "name": "Mountain",
          "sections": {
            "meaning": "Perspective, persistence, and a journey taken in smaller steps.",
            "description": "A mountain can seem unreachable from a distance. Instead of focusing on the summit, look at the next stretch of path and the support available to you.\n\nPersistence also includes pauses and a change of pace. What would help you continue in a way you can sustain?"
          }
        }
      }
    },
    {
      "id": 139,
      "faceAsset": "sample.river",
      "translations": {
        "cs": {
          "name": "Řeka",
          "sections": {
            "meaning": "Pohyb, přizpůsobení a hledání průchodné cesty.",
            "description": "Řeka hledá cestu krajinou a přitom mění svůj tvar. Zvažte, kde můžete povolit zbytečný tlak a zkusit jiný postup.\n\nPřizpůsobit se neznamená vzdát se vlastních hranic. Vyberte jeden malý krok, který dovolí věcem znovu se pohnout."
          }
        },
        "en": {
          "name": "River",
          "sections": {
            "meaning": "Movement, adaptability, and finding a way through.",
            "description": "A river finds its way through the landscape while changing shape. Consider where you could release unnecessary pressure and try another approach.\n\nAdapting does not mean giving up your boundaries. Choose one small step that could help things move again."
          }
        }
      }
    },
    {
      "id": 152,
      "faceAsset": "sample.flower",
      "translations": {
        "cs": {
          "name": "Květina",
          "sections": {
            "meaning": "Ocenění růstu a péče o to, co právě rozkvétá.",
            "description": "Květina zve k tomu, abyste si všimli výsledků nenápadné péče. Co se ve vašem životě pomalu rozvíjí, i když to zatím není velké?\n\nRůst má vlastní tempo a nemusí se podobat růstu druhých. Pojmenujte jednu věc, kterou chcete dál podporovat."
          }
        },
        "en": {
          "name": "Flower",
          "sections": {
            "meaning": "Appreciating growth and caring for what is beginning to bloom.",
            "description": "The flower invites you to notice the results of quiet care. What is gradually developing in your life, even if it still seems small?\n\nGrowth has its own pace and need not resemble anyone else's. Name one thing you want to keep supporting."
          }
        }
      }
    },
    {
      "id": 166,
      "faceAsset": "sample.feather",
      "translations": {
        "cs": {
          "name": "Pírko",
          "sections": {
            "meaning": "Lehkost a možnost odložit zbytečnou zátěž.",
            "description": "Pírko připomíná, že ne každou věc musíte nést se stejnou námahou. Který úkol, očekávání nebo požadavek můžete dnes zjednodušit?\n\nLehkost nemusí znamenat lhostejnost. Může vyrůstat z jasného rozhodnutí, čemu svou pozornost věnujete a čemu už ne."
          }
        },
        "en": {
          "name": "Feather",
          "sections": {
            "meaning": "Lightness and the possibility of setting down an unnecessary burden.",
            "description": "The feather is a reminder that not everything needs the same effort. Which task, expectation, or demand could you simplify today?\n\nLightness does not have to mean indifference. It can grow from a clear choice about what deserves your attention and what no longer does."
          }
        }
      }
    },
    {
      "id": 173,
      "faceAsset": "sample.key",
      "translations": {
        "cs": {
          "name": "Klíč",
          "sections": {
            "meaning": "Nový pohled nebo otázka, která otevírá možnosti.",
            "description": "Klíč nabízí jiný způsob, jak přistoupit k zavřeným dveřím. Zkuste změnit otázku nebo požádat o informaci, která vám zatím chybí.\n\nNe všechny dveře potřebujete otevřít. Rozlišujte mezi možností, která vás láká, a požadavkem, který vám už neslouží."
          }
        },
        "en": {
          "name": "Key",
          "sections": {
            "meaning": "A fresh perspective or a question that opens possibilities.",
            "description": "The key offers another way to approach a closed door. Try changing the question or asking for a piece of information you are missing.\n\nYou do not need to open every door. Distinguish an opportunity that interests you from a demand that no longer serves you."
          }
        }
      }
    },
    {
      "id": 185,
      "faceAsset": "sample.gate",
      "translations": {
        "cs": {
          "name": "Otevřená brána",
          "sections": {
            "meaning": "Přechod mezi známým prostorem a novou možností.",
            "description": "Otevřená brána ukazuje možnost vstoupit do něčeho nového. Než vykročíte, všimněte si, co si chcete vzít s sebou a co můžete nechat za sebou.\n\nRozhodnutí nemusí přijít okamžitě. Můžete se nejprve rozhlédnout, položit otázku a zvolit vlastní tempo."
          }
        },
        "en": {
          "name": "Open Gate",
          "sections": {
            "meaning": "A transition between familiar ground and a new possibility.",
            "description": "The open gate reveals a possibility of entering something new. Before stepping through, notice what you want to bring with you and what you can leave behind.\n\nA decision need not be immediate. You can look around, ask a question, and choose your own pace."
          }
        }
      }
    },
    {
      "id": 198,
      "faceAsset": "sample.bench",
      "translations": {
        "cs": {
          "name": "Zahradní lavička",
          "sections": {
            "meaning": "Odpočinek a místo, kde nemusíte nic dokazovat.",
            "description": "Zahradní lavička zve k obyčejnému zastavení. Na chvíli odložte plánování a všimněte si zvuků, barev nebo pohybu kolem sebe.\n\nPřestávka může být součástí dobré práce i dobrého rozhodování. Jaké malé místo pro odpočinek si dnes můžete vytvořit?"
          }
        },
        "en": {
          "name": "Garden Bench",
          "sections": {
            "meaning": "Rest and a place where you have nothing to prove.",
            "description": "The garden bench invites a simple pause. Set planning aside for a moment and notice the sounds, colors, or movement around you.\n\nA break can be part of good work and thoughtful decisions. What small space for rest could you create today?"
          }
        }
      }
    },
    {
      "id": 207,
      "faceAsset": "sample.pond",
      "translations": {
        "cs": {
          "name": "Tichý rybník",
          "sections": {
            "meaning": "Ztišení a pohled na situaci bez okamžité reakce.",
            "description": "Tichý rybník nabízí obraz klidné hladiny. Dopřejte si krátkou chvíli, než na něco odpovíte nebo se rozhodnete, co udělat dál.\n\nKlid nevyžaduje potlačení pocitů. Může znamenat, že jim dovolíte být přítomné a přesto si vyberete svou další reakci."
          }
        },
        "en": {
          "name": "Still Pond",
          "sections": {
            "meaning": "Quiet attention and a view of a situation before reacting.",
            "description": "The still pond offers an image of calm water. Give yourself a short moment before replying or deciding what to do next.\n\nCalm does not require suppressing feelings. It can mean allowing them to be present while choosing how you want to respond."
          }
        }
      }
    },
    {
      "id": 219,
      "faceAsset": "sample.roots",
      "translations": {
        "cs": {
          "name": "Kořeny",
          "sections": {
            "meaning": "Opora, která se nemusí ukazovat na povrchu.",
            "description": "Kořeny připomínají zkušenosti, vztahy a hodnoty, ze kterých čerpáte. Která z těchto opor vám v poslední době pomohla, aniž jste si toho všimli?\n\nK opoře se můžete vrátit jednoduchým návykem nebo rozhovorem. Vyberte něco, co vás spojuje s pocitem pevné půdy pod nohama."
          }
        },
        "en": {
          "name": "Roots",
          "sections": {
            "meaning": "Support that does not have to be visible on the surface.",
            "description": "Roots recall the experiences, relationships, and values that sustain you. Which of these supports has helped you recently without drawing attention to itself?\n\nYou can return to that support through a simple habit or conversation. Choose something that reconnects you with a sense of steady ground."
          }
        }
      }
    },
    {
      "id": 234,
      "faceAsset": "sample.dew",
      "translations": {
        "cs": {
          "name": "Ranní rosa",
          "sections": {
            "meaning": "Čerstvá pozornost a hodnota drobných okamžiků.",
            "description": "Ranní rosa zachycuje světlo v něčem velmi malém. Zkuste dnes věnovat pozornost detailu, který by jinak snadno unikl.\n\nNový začátek nemusí mít podobu velké změny. Může to být jeden vědomý krok, laskavé slovo nebo chvíle nerušeného vnímání."
          }
        },
        "en": {
          "name": "Morning Dew",
          "sections": {
            "meaning": "Fresh attention and the value of small moments.",
            "description": "Morning dew catches the light in something very small. Try paying attention today to a detail that might otherwise pass unnoticed.\n\nA fresh start need not take the form of a major change. It can be one deliberate step, a kind word, or a moment of undistracted attention."
          }
        }
      }
    }
  ],
  "detailTemplate": {
    "sections": [
      {
        "id": "meaning",
        "titles": {
          "cs": "Význam",
          "en": "Meaning"
        }
      },
      {
        "id": "description",
        "titles": {
          "cs": "Popis",
          "en": "Description"
        }
      }
    ]
  }
} satisfies DeckManifest;
