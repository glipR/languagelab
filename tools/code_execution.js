export const pythonPreamble = `\
import json
def to_string(a):
  if "<class" in str(a):
      return str(a)
  if "," in str(a) and hasattr(a, "__iter__"):
      return "[" + ", ".join(to_string(o) for o in a) + "]"
  if hasattr(a, "entries"):
      final = {}
      for k, v in a.entries():
          try:
              final[str(k)] = json.loads(to_string(v))
          except:
              final[str(k)] = to_string(v)
      return json.dumps(final)
  if hasattr(a, "object_entries"):
      final = {}
      for k, v in a.object_entries():
          old_print("ENTRY", k, v)
          try:
              final[str(k)] = json.loads(to_string(v))
          except:
              final[str(k)] = to_string(v)
      return json.dumps(final)
  return str(a).replace("True", "true").replace("False", "false")

old_print = print
import sys
def print(*args, sep=" ", end="\\n", file=sys.stdout, flush=False):
  old_print(sep.join(to_string(a) for a in args), end=end, file=file, flush=flush)`;
