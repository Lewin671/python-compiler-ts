# 装饰器示例
def simple_decorator(func):
    def wrapper():
        print("Something before function")
        func()
        print("Something after function")
    return wrapper

@simple_decorator
def say_hello():
    print("Hello!")

say_hello()

# 带参数的装饰器
def decorator_with_args(func):
    def wrapper(*args, **kwargs):
        print(f"Calling {func.__name__} with args {args}")
        result = func(*args, **kwargs)
        print(f"Result: {result}")
        return result
    return wrapper

@decorator_with_args
def add(a, b):
    return a + b

result = add(5, 3)

# 多个装饰器
def decorator1(func):
    def wrapper():
        print("Decorator 1 before")
        func()
        print("Decorator 1 after")
    return wrapper

def decorator2(func):
    def wrapper():
        print("Decorator 2 before")
        func()
        print("Decorator 2 after")
    return wrapper

@decorator1
@decorator2
def greet():
    print("Hello!")

greet()
