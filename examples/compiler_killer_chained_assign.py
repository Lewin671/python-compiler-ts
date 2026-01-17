# Chained assignment evaluation order
x = [0, 0]
i = 0
i = x[i] = 1
print(f"i={i}, x={x}")
