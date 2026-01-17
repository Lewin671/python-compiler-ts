# Exploit: Python's repr/str handles recursive structures by detecting cycles and using [...]
# Naive implementations will crash with a RangeError (stack overflow).
l = [1]
l.append(l)
print(l)
