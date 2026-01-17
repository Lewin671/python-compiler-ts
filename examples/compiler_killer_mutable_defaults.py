# Mutable default arguments should persist across calls
def f(val, L=[]):
    L.append(val)
    return L

f(1)
result = f(2)
print(result)
