class Trick:
    def __bool__(self):
        return False
    def __len__(self):
        return 1

t = Trick()
print(bool(t))
print("truthy" if t else "falsy")
