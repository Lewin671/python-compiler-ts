# Exposes JS-number precision loss if integers are not BigInt-backed.
print(10**20 + 1 == 10**20)
