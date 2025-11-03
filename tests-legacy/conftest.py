import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from typing import TYPE_CHECKING

# Provide a minimal tkinter stub for environments without Tcl/Tk (e.g., macOS CI).
# Guarded so mypy skips dynamic assignments while runtime still executes.
if not TYPE_CHECKING:  # pragma: no cover - runtime-only
    try:
        import tkinter  # noqa: F401
    except Exception:  # noqa: BLE001 - broad to catch ModuleNotFoundError and runtime errors
        import types

        tk_mod = types.ModuleType("tkinter")

        class _Dummy:
            def __init__(self, *args, **kwargs):
                pass

            def __call__(self, *args, **kwargs):  # e.g., BooleanVar()
                return self

            # Common widget methods used in code/tests
            def pack(self, *args, **kwargs):
                pass

            def config(self, *args, **kwargs):
                pass

            def mainloop(self, *args, **kwargs):
                pass

            def geometry(self, *args, **kwargs):
                pass

            def title(self, *args, **kwargs):
                pass

            def set(self, *args, **kwargs):
                pass

            def get(self, *args, **kwargs):
                return False

        # Top-level tkinter attributes referenced in tests/gui
        tk_mod.Tk = _Dummy
        tk_mod.Button = _Dummy
        tk_mod.Label = _Dummy
        tk_mod.Frame = _Dummy
        tk_mod.Checkbutton = _Dummy
        tk_mod.BooleanVar = _Dummy

        # Submodules used via patch targets e.g. "tkinter.messagebox.showinfo"
        messagebox_mod = types.ModuleType("tkinter.messagebox")
        messagebox_mod.showinfo = lambda *a, **k: None
        messagebox_mod.showerror = lambda *a, **k: None

        filedialog_mod = types.ModuleType("tkinter.filedialog")
        filedialog_mod.askopenfilename = lambda *a, **k: ""
        filedialog_mod.asksaveasfilename = lambda *a, **k: ""

        # Attach submodules to the tkinter namespace
        tk_mod.messagebox = messagebox_mod
        tk_mod.filedialog = filedialog_mod

        # Register modules so import machinery finds them
        sys.modules["tkinter"] = tk_mod
        sys.modules["tkinter.messagebox"] = messagebox_mod
        sys.modules["tkinter.filedialog"] = filedialog_mod
