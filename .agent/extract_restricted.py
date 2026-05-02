import json
import os

lint_file = '.agent/web_lint_errors_new.json'
output_file = '.agent/all_restricted_syntax.txt'

if os.path.exists(lint_file):
    with open(lint_file, 'r') as f:
        data = json.load(f)
    
    with open(output_file, 'w') as f_out:
        for file_data in data:
            file_path = file_data.get('filePath', '').split('/dosiq/')[-1]
            for message in file_data.get('messages', []):
                if message.get('ruleId') == 'no-restricted-syntax':
                    line = message.get('line')
                    msg = message.get('message')
                    f_out.write(f"{file_path}:{line}:{msg}\n")
    print(f"Done. Output written to {output_file}")
else:
    print(f"Error: {lint_file} not found")
