# 生成器函数
def simple_generator():
    yield 1
    yield 2
    yield 3

print("Simple generator:")
for value in simple_generator():
    print(value)

# 斐波那契生成器
def fibonacci_gen(n):
    a, b = 0, 1
    count = 0
    while count < n:
        yield a
        a, b = b, a + b
        count += 1

print("\nFibonacci generator:")
for num in fibonacci_gen(10):
    print(num, end=" ")
print()

# 使用 next() 函数
print("\nUsing next():")
gen = simple_generator()
print(next(gen))
print(next(gen))
print(next(gen))

# 生成器表达式
print("\nGenerator expression:")
gen_expr = (x**2 for x in range(5))
print(list(gen_expr))

# Send 方法
def counter_gen():
    count = 0
    while True:
        x = yield count
        if x is not None:
            count = x
        else:
            count += 1

print("\nUsing send():")
gen = counter_gen()
print(next(gen))
print(gen.send(10))
print(next(gen))
