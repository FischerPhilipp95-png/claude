# Testlauf MoneyPrinterTurbo mit eigenem Skript, Thorsten-Stimme und lokalen Clips.
# Einzige Änderung am Tool: Die Untertitel-Zeiten kommen aus den exakten Satzlängen der Stimme,
# weil die Whisper-Korrektur des Tools bei deutschem Text die Zeiten der zweiten Hälfte auf 0 setzt.
import os, shutil, sys
REPO = '/home/user/harry0703/moneyprinterturbo'
HIER = os.path.dirname(os.path.abspath(__file__))
os.chdir(REPO); sys.path.insert(0, REPO)
from app.services import subtitle
subtitle.create = lambda audio_file, subtitle_file, word_level=False, **k: shutil.copy(os.path.join(HIER, 'untertitel.srt'), subtitle_file)
subtitle.correct = lambda subtitle_file, video_script: None
import cli
raise SystemExit(cli.run_cli(sys.argv[1:]))
