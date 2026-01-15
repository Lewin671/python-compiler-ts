# Assert 语句进行简单测试
def test_addition():
    assert 2 + 2 == 4, "Addition failed"
    assert 1 + 1 == 2
    print("Addition tests passed")

def test_string():
    assert "hello".upper() == "HELLO"
    assert "hello" == "hello"
    print("String tests passed")

def test_list():
    lst = [1, 2, 3]
    assert len(lst) == 3
    assert 2 in lst
    assert 4 not in lst
    print("List tests passed")

def test_comparison():
    assert 5 > 3
    assert 2 < 5
    assert 5 >= 5
    print("Comparison tests passed")

# 运行测试
test_addition()
test_string()
test_list()
test_comparison()

print("\nAll tests passed!")

# 测试失败的示例
print("\nTesting failure case:")
try:
    assert 1 == 2, "This assertion will fail"
except AssertionError as e:
    print(f"Caught AssertionError: {e}")
