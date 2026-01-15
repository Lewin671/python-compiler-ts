# 异常处理
try:
    x = 10
    y = 0
    result = x / y
except ZeroDivisionError:
    print("Error: Cannot divide by zero")

# 多个异常
try:
    num = int("abc")
except ValueError:
    print("Error: Invalid integer")
except TypeError:
    print("Error: Type error")

# Try-except-else
try:
    result = 10 / 2
except ZeroDivisionError:
    print("Cannot divide by zero")
else:
    print(f"Result: {result}")

# Try-finally
try:
    file = open("nonexistent.txt", "r")
except FileNotFoundError:
    print("File not found")
finally:
    print("This always executes")

# 自定义异常
class CustomError(Exception):
    pass

try:
    raise CustomError("This is a custom error")
except CustomError as e:
    print(f"Caught: {e}")
