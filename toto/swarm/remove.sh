# Remove stack from development host
# ----------------------------------

#!/bin/sh

echo "Removing..."
ssh ignitial@iiozero 'bash -s' < remote/stack_remove.sh