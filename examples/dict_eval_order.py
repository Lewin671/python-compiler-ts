trace = []
def f(x):
    trace.append(str(x))
    return x

d = {f(1): f(2), f(3): f(4)}
print("-".join(trace))
