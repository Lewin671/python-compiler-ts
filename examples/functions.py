# 函数定义和调用
def greet(name):
    return f"Hello, {name}!"

print(greet("Alice"))
print(greet("Bob"))

# 默认参数
def add(a, b=10):
    return a + b

print("add(5):", add(5))
print("add(5, 15):", add(5, 15))

# 可变参数
def sum_numbers(*args):
    total = 0
    for num in args:
        total += num
    return total

print("sum(1, 2, 3):", sum_numbers(1, 2, 3))
print("sum(5, 10):", sum_numbers(5, 10))

# 关键字参数
def print_info(**kwargs):
    for key, value in kwargs.items():
        print(f"{key}: {value}")

print_info(name="Charlie", age=25, city="Boston")

# Lambda 函数
square = lambda x: x * x
print("Lambda square(5):", square(5))

numbers = [1, 2, 3, 4, 5]
doubled = list(map(lambda x: x * 2, numbers))
print("Doubled:", doubled)
