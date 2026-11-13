"""Erzeugt analyse.ipynb aus nb_src.py (Zellen durch '# %%' getrennt). Danach: jupyter nbconvert --to notebook --execute --inplace analyse.ipynb"""
import re, nbformat as nbf
src = open("nb_src.py", encoding="utf8").read()
nb = nbf.v4.new_notebook(); nb.metadata["kernelspec"] = {"display_name": "Python 3", "language": "python", "name": "python3"}
for part in re.split(r"^# %%", src, flags=re.M)[1:]:
    head, _, body = part.partition("\n")
    if "[markdown]" in head:
        nb.cells.append(nbf.v4.new_markdown_cell("\n".join(l[2:] if l.startswith("# ") else l.lstrip("#") for l in body.strip("\n").split("\n"))))
    else:
        nb.cells.append(nbf.v4.new_code_cell(body.strip("\n")))
nbf.write(nb, "analyse.ipynb")
