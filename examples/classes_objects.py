# 类定义和对象
class Dog:
    species = "Canis familiaris"
    
    def __init__(self, name, age):
        self.name = name
        self.age = age
    
    def bark(self):
        return f"{self.name} says: Woof!"
    
    def birthday(self):
        self.age += 1
        return f"{self.name} is now {self.age} years old"

# 创建对象
dog1 = Dog("Rex", 3)
dog2 = Dog("Buddy", 5)

print(dog1.bark())
print(dog2.bark())

# 访问属性
print(f"{dog1.name} is {dog1.age} years old")

# 调用方法
print(dog1.birthday())
print(f"Species: {dog1.species}")

# 继承
class Animal:
    def __init__(self, name):
        self.name = name
    
    def speak(self):
        return f"{self.name} makes a sound"

class Cat(Animal):
    def speak(self):
        return f"{self.name} says: Meow!"

cat = Cat("Whiskers")
print(cat.speak())
