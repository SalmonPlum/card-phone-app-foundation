import type { DeckManifest } from '../domain/contracts.ts';

export const alternateDeck = {
  "schemaVersion": 2,
  "id": "alternate",
  "version": "1.0.0",
  "name": {
    "cs": "Tvary pohybu",
    "en": "Shapes in Motion"
  },
  "backAsset": "alternate.back",
  "cards": [
    {
      "id": 0,
      "faceAsset": "alternate.spark",
      "translations": {
        "cs": {
          "name": "Jiskra",
          "sections": {
            "meaning": "První impuls k drobnému pokusu.",
            "description": "Jiskra zve k vyzkoušení nápadu v malém měřítku. Zvolte pokus, který je pro vás snadný a jehož výsledek vám něco napoví.\n\nVšímejte si zvědavosti, ne povinnosti uspět. I zjištění, že chcete pokračovat jinak, může být užitečné."
          }
        },
        "en": {
          "name": "Spark",
          "sections": {
            "meaning": "An initial impulse for a small experiment.",
            "description": "The spark invites you to try an idea on a small scale. Choose an easy experiment whose outcome can teach you something.\n\nNotice curiosity rather than an obligation to succeed. Discovering that you want to continue differently can also be useful."
          }
        }
      }
    },
    {
      "id": 7,
      "faceAsset": "alternate.wave",
      "translations": {
        "cs": {
          "name": "Vlna",
          "sections": {
            "meaning": "Pohyb, proměna a vlastní rytmus.",
            "description": "Vlna střídá vzestup s poklesem. Všimněte si svého dnešního tempa a zkuste mu přizpůsobit nároky, které na sebe kladete.\n\nNěkdy je čas zabrat, jindy ustoupit a nabrat dech. Hledejte rytmus, který dokážete udržet."
          }
        },
        "en": {
          "name": "Wave",
          "sections": {
            "meaning": "Movement, change, and your own rhythm.",
            "description": "A wave alternates rising and falling. Notice your pace today and try adjusting the demands you place on yourself.\n\nSometimes it is time to make an effort; sometimes it helps to step back and breathe. Look for a rhythm you can sustain."
          }
        }
      }
    },
    {
      "id": 99,
      "faceAsset": "alternate.mountain",
      "translations": {
        "cs": {
          "name": "Hora",
          "sections": {
            "meaning": "Nadhled a postup po zvládnutelných úsecích.",
            "description": "Hora připomíná, že velký úkol lze rozdělit na menší části. Vyberte nejbližší dosažitelný bod místo vzdáleného vrcholu.\n\nZastávka na cestě není selhání. Nabízí prostor rozhlédnout se a rozhodnout, jak pokračovat."
          }
        },
        "en": {
          "name": "Mountain",
          "sections": {
            "meaning": "Perspective and progress in manageable stages.",
            "description": "The mountain reminds you that a large task can be divided into smaller parts. Choose the nearest reachable point rather than the distant summit.\n\nA pause along the way is not a failure. It gives you space to look around and decide how to continue."
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
