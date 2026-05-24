from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import yt_dlp
import re

app = FastAPI(title="BaixaVid API")

# Permite o site BaixaVid chamar essa API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # depois troque pelo seu domínio: ["https://www.baixavid.com.br"]
    allow_methods=["*"],
    allow_headers=["*"],
)

class VideoRequest(BaseModel):
    url: str

def formatar_duracao(segundos):
    if not segundos:
        return "—"
    m, s = divmod(int(segundos), 60)
    h, m = divmod(m, 60)
    if h:
        return f"{h}:{m:02}:{s:02}"
    return f"{m}:{s:02}"

@app.get("/")
def root():
    return {"status": "BaixaVid API rodando ✅"}

@app.post("/info")
async def get_info(req: VideoRequest):
    url = req.url.strip()

    opcoes_ydl = {
        "quiet": True,
        "no_warnings": True,
        "skip_download": True,
        # Cookies ajudam a evitar bloqueios (opcional, adicione depois se precisar)
    }

    try:
        with yt_dlp.YoutubeDL(opcoes_ydl) as ydl:
            info = ydl.extract_info(url, download=False)
    except yt_dlp.utils.DownloadError as e:
        raise HTTPException(status_code=400, detail=f"Não foi possível processar esse link: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")

    # Montar lista de formatos disponíveis
    formatos = []
    vistos = set()

    for f in info.get("formats", []):
        url_f = f.get("url")
        ext = f.get("ext", "mp4")
        altura = f.get("height")
        tipo = f.get("vcodec", "none")
        acodec = f.get("acodec", "none")

        if not url_f or url_f in vistos:
            continue

        # Só vídeo com áudio, ou só áudio
        tem_video = tipo != "none" and tipo is not None
        tem_audio = acodec != "none" and acodec is not None

        if tem_video and tem_audio:
            label = f"{altura}p" if altura else "Vídeo"
            formatos.append({
                "label": label,
                "tipo": "video",
                "ext": ext,
                "url": url_f,
                "qualidade": altura or 0,
            })
            vistos.add(url_f)

        elif not tem_video and tem_audio:
            formatos.append({
                "label": "Só o áudio",
                "tipo": "mp3",
                "ext": "mp3",
                "url": url_f,
                "qualidade": 0,
            })
            vistos.add(url_f)

    # Ordenar por qualidade (maior primeiro) e limitar a 5 opções
    videos = sorted(
        [f for f in formatos if f["tipo"] == "video"],
        key=lambda x: x["qualidade"],
        reverse=True
    )[:4]

    audios = [f for f in formatos if f["tipo"] == "mp3"][:1]

    return {
        "titulo": info.get("title", "Vídeo"),
        "autor": info.get("uploader") or info.get("channel") or "@usuario",
        "duracao": formatar_duracao(info.get("duration")),
        "thumbnail": info.get("thumbnail"),
        "plataforma": info.get("extractor_key", "").lower(),
        "formatos": videos + audios,
    }
