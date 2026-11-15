import sys
from PIL import Image
src, dst = sys.argv[1], sys.argv[2]
Image.open(src).save(dst)
print(dst)
