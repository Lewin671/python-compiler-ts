# Break 和 Continue 语句
print("Break example:")
for i in range(10):
    if i == 5:
        break
    print(i, end=" ")
print()

print("\nContinue example:")
for i in range(10):
    if i % 2 == 0:
        continue
    print(i, end=" ")
print()

# 嵌套循环中的 break
print("\nNested loop with break:")
for i in range(3):
    for j in range(3):
        if j == 1:
            break
        print(f"({i}, {j})", end=" ")
print()

# While 循环中的 break 和 continue
print("\nWhile with break and continue:")
count = 0
while count < 10:
    count += 1
    if count == 3:
        continue
    if count == 8:
        break
    print(count, end=" ")
print()

# Pass 语句
print("\nPass statement:")
for i in range(3):
    if i == 1:
        pass  # 占位符
    else:
        print(f"i = {i}")
