# BaixaVid API

Backend do BaixaVid usando yt-dlp + FastAPI.

## Rodar local (para testar)

```bash
pip install -r requirements.txt
uvicorn main:app --reload
```

Acesse: http://localhost:8000

## Testar

```bash
curl -X POST http://localhost:8000/info \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.tiktok.com/@usuario/video/123"}'
```

## Deploy no Railway

1. Suba essa pasta para um repositório GitHub
2. No Railway, clique em "New Project" → "Deploy from GitHub"
3. Selecione o repositório
4. O Railway detecta o Procfile e faz o deploy automático
