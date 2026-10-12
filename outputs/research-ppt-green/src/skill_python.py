"""Run installed PPT skill utilities with available document libraries."""
import sys,runpy
sys.path.append(r'C:\ProgramData\Anaconda3\Lib\site-packages')
from pathlib import Path
script=sys.argv.pop(1)
sys.path.insert(0,str(Path(script).parent))
runpy.run_path(script,run_name='__main__')
