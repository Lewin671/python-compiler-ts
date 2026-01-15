# Global 和 Nonlocal 关键字
x = 10

def modify_global():
    global x
    x = 20
    print(f"Inside function: x = {x}")

print(f"Before: x = {x}")
modify_global()
print(f"After: x = {x}")

# Nonlocal 关键字
def outer():
    y = 10
    print(f"Outer y: {y}")
    
    def inner():
        nonlocal y
        y = 20
        print(f"Inner y after modification: {y}")
    
    inner()
    print(f"Outer y after inner call: {y}")

outer()

# 闭包示例
def make_multiplier(n):
    def multiplier(x):
        return x * n
    return multiplier

times3 = make_multiplier(3)
times5 = make_multiplier(5)

print(f"times3(10) = {times3(10)}")
print(f"times5(10) = {times5(10)}")

# 列表作为默认参数（陷阱）
def append_to_list(item, list_arg=[]):
    list_arg.append(item)
    return list_arg

print("\nDefault mutable argument:")
print(append_to_list(1))
print(append_to_list(2))
print(append_to_list(3))
