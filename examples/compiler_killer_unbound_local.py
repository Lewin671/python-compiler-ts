# Exploit: Python determines scope at compile-time.
x = "global"
def test():
    try:
        print(x)
    except UnboundLocalError:
        print("Caught UnboundLocalError")
    except NameError:
        print("Caught NameError")
    except Exception as e:
        print(f"Caught {type(e).__name__}")
    x = "local"
test()
print(f"Global x remains: {x}")