const fs = require('fs');
let content = fs.readFileSync('src/components/AdvocacyModule.tsx', 'utf8');

content = content.replace(/const \[newCaseMemberId, setNewCaseMemberId\] = useState\(''\);/, "const [newCaseMember, setNewCaseMember] = useState<Member | null>(null);");
content = content.replace(/const selectedMbr = members\.find\(m => m\.id === newCaseMemberId\);/, "const selectedMbr = newCaseMember;");
content = content.replace(/selectedMemberId=\{newCaseMemberId\}/, "selectedMemberId={newCaseMember?.id || ''}");
content = content.replace(/onSelectMember=\{\(m\) => setNewCaseMemberId\(m \? m\.id : ''\)\}/, "onSelectMember={setNewCaseMember}");
content = content.replace(/setNewCaseMemberId\(''\);/, "setNewCaseMember(null);");

fs.writeFileSync('src/components/AdvocacyModule.tsx', content);
