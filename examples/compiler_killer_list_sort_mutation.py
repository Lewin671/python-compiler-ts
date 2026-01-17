# list.sort should raise ValueError if the list is mutated during sort
L = [3, 1, 2]
def key_func(x):
    L.append(x)
    return x

try:
    L.sort(key=key_func)
    print("Failure: List modified during sort but no error raised")
except ValueError:
    print("Success: ValueError caught")
except Exception as e:
    print(f"Failure: Wrong exception {type(e).__name__}: {e}")
