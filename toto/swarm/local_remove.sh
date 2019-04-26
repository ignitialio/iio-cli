# Remove stack from Swarm master
# ------------------------------

#!/bin/sh

echo "Removing..."
ssh ignitial@iiozero 'bash -s' < remote/stack_remove.sh