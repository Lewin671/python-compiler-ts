# Exploit: Re-evaluation of index in augmented assignment
i = 0
def get_idx():
    global i
    res = i
    i += 1
    return res

x = [0, 0]
x[get_idx()] += 1
print(f"x: {x}, i: {i}")
