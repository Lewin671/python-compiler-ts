# Filter 和 Map 操作
numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

# Filter
evens = list(filter(lambda x: x % 2 == 0, numbers))
print("Evens:", evens)

# Map
doubled = list(map(lambda x: x * 2, numbers))
print("Doubled:", doubled)

# Zip 操作
names = ["Alice", "Bob", "Charlie"]
ages = [25, 30, 35]
zipped = list(zip(names, ages))
print("Zipped:", zipped)

for name, age in zip(names, ages):
    print(f"{name}: {age}")

# Enumerate
for i, name in enumerate(names):
    print(f"{i}: {name}")

# Sorted 和 Reversed
data = [3, 1, 4, 1, 5, 9, 2, 6]
print("Sorted:", sorted(data))
print("Reversed:", list(reversed(data)))

# Range 操作
print("Range(5):", list(range(5)))
print("Range(2, 8):", list(range(2, 8)))
print("Range(0, 10, 2):", list(range(0, 10, 2)))
