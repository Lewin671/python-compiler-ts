print("--- Class Scope Invisibility ---")
try:
    class Test:
        secret = "class_var"
        # Comprehension creates a new scope.
        # It should NOT see 'secret' from the class body.
        data = [secret for _ in [1]]
    print(f"FAILURE: Accessed class variable: {Test.data}")
except NameError:
    print("SUCCESS: NameError caught (Class scope correctly skipped)")
except Exception as e:
    print(f"FAILURE: Wrong exception: {type(e).__name__}")
