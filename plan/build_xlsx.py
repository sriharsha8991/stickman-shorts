"""Build Stickman_Shorts_Content_Plan.xlsx from topics.py."""
import os

from openpyxl import Workbook
from openpyxl.comments import Comment
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.datavalidation import DataValidation

from topics import COLUMNS, FORMATS, PILLARS, build_rows

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "Stickman_Shorts_Content_Plan.xlsx")

F = "Arial"
HDR_FILL = PatternFill("solid", fgColor="1F2A44")
HDR_FONT = Font(name=F, bold=True, color="FFFFFF", size=10)
BODY = Font(name=F, size=10)
BOLD = Font(name=F, size=10, bold=True)
TITLE = Font(name=F, size=14, bold=True)
EDIT_FILL = PatternFill("solid", fgColor="FFF2CC")  # cells the user/pipeline updates
DONE_FILL = PatternFill("solid", fgColor="D9EAD3")
THIN = Side(style="thin", color="D0D0D0")
BOX = Border(left=THIN, right=THIN, top=THIN, bottom=THIN)
WRAP = Alignment(wrap_text=True, vertical="top")
PILLAR_FILL = {"A": "E8F0FE", "B": "FEF3E2", "C": "EAF6EC", "D": "F3E8FD", "E": "FDE8E8", "F": "EDEDED"}

WIDTHS = {"ID": 7, "Status": 11, "Phase": 13, "Post date": 11, "Pillar": 22, "Format": 16, "Title": 34,
          "Hook overlay (frame 1)": 26, "Hook line (caption)": 42, "Mechanism / angle": 42, "Visual metaphor": 32,
          "Twist": 34, "Payoff / takeaway": 32, "Loop / bookend": 22, "Length (s)": 8, "Primary goal": 12,
          "Facts to verify": 44, "Risk flag": 26, "Music mood": 32, "Notes": 30}

rows = build_rows()
wb = Workbook()

# ---------------------------------------------------------------- Content Plan
ws = wb.active
ws.title = "Content Plan"
ws.append(COLUMNS)
for c in ws[1]:
    c.font, c.fill, c.alignment, c.border = HDR_FONT, HDR_FILL, Alignment(wrap_text=True, vertical="center"), BOX
ws.row_dimensions[1].height = 30
for r in rows:
    ws.append([r[k] for k in COLUMNS])
for i, r in enumerate(rows, start=2):
    fill = PatternFill("solid", fgColor=PILLAR_FILL[r["Pillar"][0]])
    for j, k in enumerate(COLUMNS, start=1):
        c = ws.cell(row=i, column=j)
        c.font, c.alignment, c.border = BODY, WRAP, BOX
        if k in ("Pillar", "ID"):
            c.fill = fill
        if k == "Status":
            c.fill = DONE_FILL if r["Status"] == "Produced" else EDIT_FILL
    ws.row_dimensions[i].height = 75
for k, w in WIDTHS.items():
    ws.column_dimensions[get_column_letter(COLUMNS.index(k) + 1)].width = w
ws.freeze_panes = "H2"
ws.auto_filter.ref = f"A1:{get_column_letter(len(COLUMNS))}{len(rows) + 1}"
status_col = get_column_letter(COLUMNS.index("Status") + 1)
dv = DataValidation(type="list", formula1='"Planned,Scripted,Built,Rendered,Reviewed,Scheduled,Posted,Produced,Skipped"', allow_blank=False)
ws.add_data_validation(dv)
dv.add(f"{status_col}2:{status_col}{len(rows) + 1}")
ws[f"{status_col}1"].comment = Comment(
    "Yellow = update as the video moves through the pipeline. The scheduled task marks progress in the GitHub "
    "repo's plan/status.csv and in the Drive 'Videos' folder; mirror it here if you track by hand.", "Claude")
fact_col = get_column_letter(COLUMNS.index("Facts to verify") + 1)
ws[f"{fact_col}1"].comment = Comment(
    "NOT yet verified. Each production run must check these claims against primary sources before scripting.", "Claude")

# ---------------------------------------------------------------- Summary (formulas)
sm = wb.create_sheet("Summary")
sm["A1"] = "Stickman Shorts: 100-video plan at a glance"
sm["A1"].font = TITLE
sm["A2"] = "All counts are live formulas over the Content Plan tab."
sm["A2"].font = Font(name=F, size=9, italic=True)
last = len(rows) + 1
pcol, fcol, phcol = (get_column_letter(COLUMNS.index(k) + 1) for k in ("Pillar", "Format", "Phase"))
lcol = get_column_letter(COLUMNS.index("Length (s)") + 1)

def header(row, labels):
    for j, t in enumerate(labels, start=1):
        c = sm.cell(row=row, column=j, value=t)
        c.font, c.fill, c.border = HDR_FONT, HDR_FILL, BOX

header(4, ["Pillar", "Description", "Phase 1", "Phase 2", "Total", "Share"])
r0 = 5
for i, (p, desc) in enumerate(PILLARS.items()):
    r = r0 + i
    key = f"{p} · {desc.split(' (')[0]}"
    sm.cell(row=r, column=1, value=key)
    sm.cell(row=r, column=2, value=desc)
    sm.cell(row=r, column=3, value=f"=COUNTIFS('Content Plan'!${pcol}$2:${pcol}${last},A{r},'Content Plan'!${phcol}$2:${phcol}${last},\"1*\")")
    sm.cell(row=r, column=4, value=f"=COUNTIFS('Content Plan'!${pcol}$2:${pcol}${last},A{r},'Content Plan'!${phcol}$2:${phcol}${last},\"2*\")")
    sm.cell(row=r, column=5, value=f"=C{r}+D{r}")
    sm.cell(row=r, column=6, value=f"=IF(SUM($E${r0}:$E${r0 + 5})=0,0,E{r}/SUM($E${r0}:$E${r0 + 5}))")
    sm.cell(row=r, column=6).number_format = "0%"
tr = r0 + 6
sm.cell(row=tr, column=1, value="Total").font = BOLD
for col in "CDE":
    sm[f"{col}{tr}"] = f"=SUM({col}{r0}:{col}{tr - 1})"
    sm[f"{col}{tr}"].font = BOLD

header(tr + 2, ["Format", "Music mood", "Videos", "Avg length (s)", "", ""])
f0 = tr + 3
for i, (code, (name, mood)) in enumerate(FORMATS.items()):
    r = f0 + i
    sm.cell(row=r, column=1, value=name)
    sm.cell(row=r, column=2, value=mood)
    sm.cell(row=r, column=3, value=f"=COUNTIF('Content Plan'!${fcol}$2:${fcol}${last},A{r})")
    sm.cell(row=r, column=4, value=f"=IFERROR(AVERAGEIF('Content Plan'!${fcol}$2:${fcol}${last},A{r},'Content Plan'!${lcol}$2:${lcol}${last}),0)")
    sm.cell(row=r, column=4).number_format = "0"

header(f0 + 7, ["Status", "", "Videos", "", "", ""])
s0 = f0 + 8
for i, st in enumerate(["Produced", "Planned", "Scripted", "Rendered", "Posted", "Skipped"]):
    r = s0 + i
    sm.cell(row=r, column=1, value=st)
    sm.cell(row=r, column=3, value=f"=COUNTIF('Content Plan'!${status_col}$2:${status_col}${last},A{r})")
for row in sm.iter_rows(min_row=4, max_row=s0 + 6):
    for c in row:
        if c.font != HDR_FONT and not c.font.bold:
            c.font = BODY
        c.alignment = Alignment(wrap_text=True, vertical="top")
for col, w in zip("ABCDEF", (30, 60, 10, 14, 10, 10)):
    sm.column_dimensions[col].width = w

# ---------------------------------------------------------------- Rules
ru = wb.create_sheet("Production Rules")
rules = [
    ("Positioning", "The Hidden Mechanism: how AI, money and your brain quietly work, explained with stick figures. Audience: people upgrading themselves with AI and money."),
    ("Every video", "One invisible mechanism · one visual metaphor · one twist · one upgrade move · one CTA."),
    ("Hook", "Three layers at 0:00: strong first frame (works muted) + text overlay + caption line. Write 5 hooks, score with youtube-agent-skill hookscore.py, ship only >= 55 (WORKABLE)."),
    ("Retention", "Visual change every 2-4 s (uneven); kinetic word captions; one 'wow' moment; loop or bookend ending; safe zone x 90-990, y 250-1500."),
    ("Facts", "Verify every claim in 'Facts to verify' against a primary source before scripting; credit sources on screen when quoting; never invent numbers."),
    ("Finance (SEBI)", "Education only: no buy/sell/hold calls, no tickers, no prices newer than 3 months, include 'education, not advice'. No paid deals with brokers/AMCs while unregistered."),
    ("YouTube originality", "Rotate formats (never the same format back-to-back); unique angle, metaphor and music per video; human review before posting (July 2026 inauthentic-content rules)."),
    ("Real people", "Shown only as labelled generic figures; no AI likeness of real people discussing finance/health."),
    ("Music", "Original MIDI score per video (music-gen + GeneralUser GS SoundFont), scenes start on bar lines; SFX synthesized (stickman-video)."),
    ("Delivery", "MP4 1080x1920 -> GitHub release; script/post copy -> Drive 'Videos' doc; update email -> Gmail thread 'Stickman Shorts — production updates'. Nothing is auto-posted."),
]
ru["A1"] = "Production rules (applied by every scheduled run)"
ru["A1"].font = TITLE
for i, (k, v) in enumerate(rules, start=3):
    ru.cell(row=i, column=1, value=k).font = BOLD
    ru.cell(row=i, column=2, value=v).font = BODY
    ru.cell(row=i, column=2).alignment = WRAP
    ru.row_dimensions[i].height = 45
ru.column_dimensions["A"].width = 22
ru.column_dimensions["B"].width = 110

# legend on the plan tab is in the Status header comment; add a short note row in Summary
sm[f"A{s0 + 8}"] = "Legend: yellow Status cells are the ones to update; green = already produced (V001, V002 example rows)."
sm[f"A{s0 + 8}"].font = Font(name=F, size=9, italic=True)

wb.save(OUT)
print("saved", OUT)
