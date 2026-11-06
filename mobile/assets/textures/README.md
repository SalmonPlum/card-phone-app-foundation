# Shuffle fabric

Original neutral cloth-relief artwork is authored by
`scripts/generate-shuffle-fabric.py` using Python's standard library. No external
texture image was downloaded. Regenerate from `mobile/`:

```sh
python3 scripts/generate-shuffle-fabric.py
```

Woven linen uses a 128px base and 256px `@2x` variant for a 128dp tile.
Checked cloth uses a 320px base and 640px `@2x` variant for a 320dp tile.
Highlight/shadow pixels are translucent so the resource's mat color stays visible.
The 1x variant averages premultiplied color/alpha from 2x. The original `woven-linen` family totals 84,607 bytes; `checked-cloth` totals
176,952 bytes before packaging. Checked cloth uses 80dp gingham squares with
light/single-band/crossed-band tones and fine woven relief.

The native registry must require `woven-linen.png`, without a density suffix;
Metro chooses the appropriate variant. The pure texture catalog records both
dimensions. Theme resources select the key and opacity; the texture view is
static, excluded from accessibility/input, and never changes layout or clocks.
