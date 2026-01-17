# Exploit: Python sets must treat objects that are equal as the same element.
# This includes 1 and True, 0 and False, and 1 and 1.0.
# JS Sets distinguish between some of these, and naive wrappers may fail.

s1 = {1, True}
s2 = {0, False}
s3 = {1, 1.0}

print(f"len1: {len(s1)}")
print(f"len2: {len(s2)}")
print(f"len3: {len(s3)}")

print(f"1 in s1: {1 in s1}")
print(f"True in s1: {True in s1}")
print(f"0 in s2: {0 in s2}")
print(f"False in s2: {False in s2}")
print(f"1 in s3: {1 in s3}")
print(f"1.0 in s3: {1.0 in s3}")
