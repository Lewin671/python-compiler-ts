# 布尔类型和逻辑运算
x = True
y = False

print("x and y:", x and y)
print("x or y:", x or y)
print("not x:", not x)

# 比较运算
a = 10
b = 20

print(f"{a} == {b}:", a == b)
print(f"{a} != {b}:", a != b)
print(f"{a} < {b}:", a < b)
print(f"{a} > {b}:", a > b)
print(f"{a} <= {b}:", a <= b)
print(f"{a} >= {b}:", a >= b)

# 链式比较
c = 15
print(f"{a} < {c} < {b}:", a < c < b)

# 成员运算符
numbers = [1, 2, 3, 4, 5]
print("3 in numbers:", 3 in numbers)
print("6 not in numbers:", 6 not in numbers)

# 布尔条件
if (x or (a < b and not y)):
    print("Complex condition is true")

# 三元运算符
result = "positive" if a > 0 else "non-positive"
print(f"a is {result}")
