# msdf-bmfont-web

Web tool for creation of MSDF bitmap font spritesheets and JSON, using [msdf-bmfont-xml](https://github.com/soimy/msdf-bmfont-xml).

## Overview

The A-Frame `text` component, based on [three-bmfont-text](https://github.com/Jam3/three-bmfont-text), use multi-channel signed distance (MSDF) fonts. MSDF helps to preserve sharp corners and edges in WebGL.

Bitmap font rendering limits you to the characters included in the font (Unicode this is not), and in languages like Chinese, the number of possible characters is very large. So, as best practice, developers should load only the characters needed for a particular experience.

This web tool provides a simple interface for creating MSDF fonts. It does not (yet) expose any of the `msdfgen` options, but those may be added to the UI in the future.

### Using MSDF fonts with A-Frame

This tool uses a newer version of `msdfgen`, and to use them with A-Frame it is necessary to set `text.negate=false`. This flag is currently available on A-Frame master and will be released with A-Frame 0.8.0.

```html
<a-text value="你好，世界"
        font="custom-msdf.json"
        color="#33C3F0"
        negate="true">
</a-text>
```

## Alternatives

MSDF fonts may be generated with [Hiero](https://github.com/libgdx/libgdx/wiki/Hiero). [See this guide for generating SDF fonts](https://github.com/libgdx/libgdx/wiki/Distance-field-fonts).

## Screenshot

![screenshot](https://user-images.githubusercontent.com/1848368/36068226-18e1c3ec-0e85-11e8-81a6-b83cde3dcdd1.png)

## Local development

```
npm install
npm run dev
```

## Deployment

See [Kubernetes documentation](https://cloud.google.com/kubernetes-engine/docs/tutorials/hello-app).



