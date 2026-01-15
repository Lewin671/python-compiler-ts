# 列表操作
fruits = ["apple", "banana", "cherry"]
print("Fruits:", fruits)
print("First fruit:", fruits[0])
print("Length:", len(fruits))

# 列表方法
fruits.append("date")
print("After append:", fruits)

# 列表推导式
numbers = [1, 2, 3, 4, 5]
squared = [x * x for x in numbers]
print("Squared:", squared)

# 字典操作
person = {"name": "Alice", "age": 30, "city": "NYC"}
print("Person:", person)
print("Name:", person["name"])
print("Age:", person["age"])

# 字典遍历
print("Dictionary items:")
for key in person:
    print(f"  {key}: {person[key]}")

# 字典推导式
dict_squared = {x: x*x for x in [1, 2, 3]}
print("Dict squared:", dict_squared)
