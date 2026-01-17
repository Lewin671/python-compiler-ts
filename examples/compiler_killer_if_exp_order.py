# If expression evaluation order: condition first, then one of the branches
trace = []
def f(x):
    trace.append(str(x))
    return True

val = f(1) if f(2) else f(3)
print("-".join(trace))
