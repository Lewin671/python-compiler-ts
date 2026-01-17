# Exploit Hypothesis: Precision loss when converting large BigInts to Floats and incorrect equality semantics.

x = 2**60 + 1
y = float(x)
# In Python, y should be 1152921504606846976.0
# and x == y should be False.
print(x == y)
# Even if y was rounded to 1152921504606847000.0 (as seen in Actual),
# x (1152921504606846977) should still not be equal to it.
