# 上下文管理器
class SimpleContextManager:
    def __init__(self, name):
        self.name = name
    
    def __enter__(self):
        print(f"Entering {self.name}")
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        print(f"Exiting {self.name}")
        return False

print("Context manager example:")
with SimpleContextManager("My Context") as ctx:
    print(f"Inside context: {ctx.name}")

# 文件处理（最常见的上下文管理器）
print("\nFile handling:")
try:
    with open("/tmp/test.txt", "w") as f:
        f.write("Hello, World!")
    print("File written successfully")
except Exception as e:
    print(f"Error: {e}")

# 多个上下文管理器
print("\nMultiple contexts:")
try:
    with SimpleContextManager("First"):
        print("In first")
        with SimpleContextManager("Second"):
            print("In second")
except Exception as e:
    print(f"Error: {e}")
