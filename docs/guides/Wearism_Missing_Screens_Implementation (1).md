**WEARISM**

Frontend --- Missing Screens Implementation

**7 Tasks to Complete Before Testing Phase**

*All backend APIs exist and are ready · Estimated 3--4 hours total*

  -------- ------------------------------- ---------- -------------------------
  **\#**   **Task**                        **Type**   **Estimated Time**

  **1**    **Delete Post**                 Wire up    15 min
                                           API        

  **2**    **Report Post**                 Wire up    20 min
                                           API        

  **3**    **Outfit List View**            New Screen 45 min

  **4**    **Outfit Detail View**          New Screen 30 min

  **5**    **Outfit Edit + Delete**        Wire up    20 min
                                           API        

  **6**    **Vendor Product Creation**     New Screen 60 min

  **7**    **Product Activate/Deactivate** Wire up    15 min
                                           API        
  -------- ------------------------------- ---------- -------------------------

+-----------------------------------------------------------------------+
| **TASK 1 · Wire up existing API**                                     |
|                                                                       |
| **Delete Post**                                                       |
+-----------------------------------------------------------------------+

The delete button exists in the UI but the API call is not wired. This
is a one-function addition to post-detail.tsx.

+-----------------------------------------------------------------------+
| **🔗 API**                                                            |
|                                                                       |
| DELETE /posts/:id → 200 { success: true }                             |
+-----------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| // app/social/post-detail.tsx --- ADD this mutation                   |
|                                                                       |
| import { useMutation, useQueryClient } from                           |
| \'@tanstack/react-query\';                                            |
|                                                                       |
| import { useRouter } from \'expo-router\';                            |
|                                                                       |
| import { Alert } from \'react-native\';                               |
|                                                                       |
| const qc = useQueryClient();                                          |
|                                                                       |
| const router = useRouter();                                           |
|                                                                       |
| const { user } = useAuthStore();                                      |
|                                                                       |
| const deleteMutation = useMutation({                                  |
|                                                                       |
| mutationFn: () =\> apiClient.delete(\`/posts/\${post.id}\`),          |
|                                                                       |
| onSuccess: () =\> {                                                   |
|                                                                       |
| // Remove from feed cache immediately                                 |
|                                                                       |
| qc.invalidateQueries({ queryKey: \[\'feed\', \'home\'\] });           |
|                                                                       |
| qc.invalidateQueries({ queryKey: \[\'posts\', user?.id\] });          |
|                                                                       |
| router.back();                                                        |
|                                                                       |
| },                                                                    |
|                                                                       |
| onError: () =\> Alert.alert(\'Error\', \'Could not delete post. Try   |
| again.\'),                                                            |
|                                                                       |
| });                                                                   |
|                                                                       |
| const handleDelete = () =\> {                                         |
|                                                                       |
| Alert.alert(                                                          |
|                                                                       |
| \'Delete Post\',                                                      |
|                                                                       |
| \'This will permanently remove your post.\',                          |
|                                                                       |
| \[                                                                    |
|                                                                       |
| { text: \'Cancel\', style: \'cancel\' },                              |
|                                                                       |
| {                                                                     |
|                                                                       |
| text: \'Delete\',                                                     |
|                                                                       |
| style: \'destructive\',                                               |
|                                                                       |
| onPress: () =\> deleteMutation.mutate(),                              |
|                                                                       |
| },                                                                    |
|                                                                       |
| \]                                                                    |
|                                                                       |
| );                                                                    |
|                                                                       |
| };                                                                    |
|                                                                       |
| // Show delete option ONLY for own posts:                             |
|                                                                       |
| // {post.user_id === user?.id && (                                    |
|                                                                       |
| // \<TouchableOpacity onPress={handleDelete}\>                        |
|                                                                       |
| // \<Ionicons name=\'trash-outline\' size={20}                        |
| color=\'rgba(255,255,255,0.6)\' /\>                                   |
|                                                                       |
| // \</TouchableOpacity\>                                              |
|                                                                       |
| // )}                                                                 |
+-----------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| **✅ Task 1 Done When:**                                              |
|                                                                       |
| ☑ Trash icon appears on own posts only (not on other users\' posts)   |
|                                                                       |
| ☑ Confirmation alert appears before deleting                          |
|                                                                       |
| ☑ Post disappears from feed immediately after deletion                |
+-----------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| **TASK 2 · Wire up existing API**                                     |
|                                                                       |
| **Report Post**                                                       |
+-----------------------------------------------------------------------+

Add a 3-dot menu to post cards that opens a bottom sheet with report
reasons. Post detail and feed cards both need this.

+-----------------------------------------------------------------------+
| **🔗 API**                                                            |
|                                                                       |
| POST /posts/:id/report { reason: string, detail?: string } → 200 {    |
| success: true, reported: true }                                       |
+-----------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| // src/components/ReportModal.tsx --- new reusable component          |
|                                                                       |
| import { useState } from \'react\';                                   |
|                                                                       |
| import { View, Text, TouchableOpacity, Modal } from \'react-native\'; |
|                                                                       |
| import { useMutation } from \'@tanstack/react-query\';                |
|                                                                       |
| import { apiClient } from \'../lib/apiClient\';                       |
|                                                                       |
| const REASONS = \[                                                    |
|                                                                       |
| { value: \'spam\', label: \'Spam\' },                                 |
|                                                                       |
| { value: \'nsfw\', label: \'Inappropriate content\' },                |
|                                                                       |
| { value: \'harassment\', label: \'Harassment\' },                     |
|                                                                       |
| { value: \'misinformation\', label: \'Misinformation\' },             |
|                                                                       |
| { value: \'other\', label: \'Other\' },                               |
|                                                                       |
| \];                                                                   |
|                                                                       |
| export function ReportModal({                                         |
|                                                                       |
| postId,                                                               |
|                                                                       |
| visible,                                                              |
|                                                                       |
| onClose,                                                              |
|                                                                       |
| }: {                                                                  |
|                                                                       |
| postId: string;                                                       |
|                                                                       |
| visible: boolean;                                                     |
|                                                                       |
| onClose: () =\> void;                                                 |
|                                                                       |
| }) {                                                                  |
|                                                                       |
| const \[selected, setSelected\] = useState\<string \| null\>(null);   |
|                                                                       |
| const \[done, setDone\] = useState(false);                            |
|                                                                       |
| const mutation = useMutation({                                        |
|                                                                       |
| mutationFn: () =\> apiClient.post(\`/posts/\${postId}/report\`, {     |
| reason: selected }),                                                  |
|                                                                       |
| onSuccess: () =\> setDone(true),                                      |
|                                                                       |
| });                                                                   |
|                                                                       |
| return (                                                              |
|                                                                       |
| \<Modal visible={visible} transparent animationType=\'slide\'         |
| onRequestClose={onClose}\>                                            |
|                                                                       |
| \<TouchableOpacity                                                    |
|                                                                       |
| className=\'flex-1 bg-black/60\'                                      |
|                                                                       |
| activeOpacity={1}                                                     |
|                                                                       |
| onPress={onClose}                                                     |
|                                                                       |
| /\>                                                                   |
|                                                                       |
| \<View className=\'bg-\[#111\] rounded-t-3xl p-6 pb-10\'\>            |
|                                                                       |
| {done ? (                                                             |
|                                                                       |
| \<\>                                                                  |
|                                                                       |
| \<Text style={{ fontFamily: \'HelveticaNeue-Bold\' }}                 |
|                                                                       |
| className=\'text-white text-lg text-center mb-2\'\>                   |
|                                                                       |
| Report submitted                                                      |
|                                                                       |
| \</Text\>                                                             |
|                                                                       |
| \<Text className=\'text-white/50 text-center mb-6\'\>                 |
|                                                                       |
| Thank you. We\'ll review this post.                                   |
|                                                                       |
| \</Text\>                                                             |
|                                                                       |
| \<TouchableOpacity onPress={() =\> { setDone(false); onClose(); }}    |
|                                                                       |
| className=\'bg-\[#FF6B35\] rounded-full py-3\'\>                      |
|                                                                       |
| \<Text style={{ fontFamily: \'HelveticaNeue-Heavy\' }}                |
|                                                                       |
| className=\'text-white text-center\'\>DONE\</Text\>                   |
|                                                                       |
| \</TouchableOpacity\>                                                 |
|                                                                       |
| \</\>                                                                 |
|                                                                       |
| ) : (                                                                 |
|                                                                       |
| \<\>                                                                  |
|                                                                       |
| \<Text style={{ fontFamily: \'HelveticaNeue-Bold\' }}                 |
|                                                                       |
| className=\'text-white text-lg mb-4\'\>                               |
|                                                                       |
| Report Post                                                           |
|                                                                       |
| \</Text\>                                                             |
|                                                                       |
| {REASONS.map(r =\> (                                                  |
|                                                                       |
| \<TouchableOpacity                                                    |
|                                                                       |
| key={r.value}                                                         |
|                                                                       |
| onPress={() =\> setSelected(r.value)}                                 |
|                                                                       |
| className={\`flex-row items-center py-3 px-4 rounded-xl mb-2 \${      |
|                                                                       |
| selected === r.value                                                  |
|                                                                       |
| ? \'bg-\[#FF6B35\]/20 border border-\[#FF6B35\]\'                     |
|                                                                       |
| : \'bg-white/5 border border-white/10\'                               |
|                                                                       |
| }\`}                                                                  |
|                                                                       |
| \>                                                                    |
|                                                                       |
| \<Text className=\'text-white flex-1\'\>{r.label}\</Text\>            |
|                                                                       |
| {selected === r.value && (                                            |
|                                                                       |
| \<Ionicons name=\'checkmark-circle\' size={20} color=\'#FF6B35\' /\>  |
|                                                                       |
| )}                                                                    |
|                                                                       |
| \</TouchableOpacity\>                                                 |
|                                                                       |
| ))}                                                                   |
|                                                                       |
| \<TouchableOpacity                                                    |
|                                                                       |
| onPress={() =\> mutation.mutate()}                                    |
|                                                                       |
| disabled={!selected \|\| mutation.isPending}                          |
|                                                                       |
| className={\`rounded-full py-3 mt-2 \${ selected ? \'bg-\[#FF6B35\]\' |
| : \'bg-white/10\' }\`}                                                |
|                                                                       |
| \>                                                                    |
|                                                                       |
| \<Text style={{ fontFamily: \'HelveticaNeue-Heavy\' }}                |
|                                                                       |
| className=\'text-white text-center\'\>                                |
|                                                                       |
| {mutation.isPending ? \'Submitting\...\' : \'SUBMIT REPORT\'}         |
|                                                                       |
| \</Text\>                                                             |
|                                                                       |
| \</TouchableOpacity\>                                                 |
|                                                                       |
| \</\>                                                                 |
|                                                                       |
| )}                                                                    |
|                                                                       |
| \</View\>                                                             |
|                                                                       |
| \</Modal\>                                                            |
|                                                                       |
| );                                                                    |
|                                                                       |
| }                                                                     |
+-----------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| // In post-detail.tsx and feed post cards --- wire up the modal:      |
|                                                                       |
| const \[reportVisible, setReportVisible\] = useState(false);          |
|                                                                       |
| // 3-dot menu button (show on all posts, including own):              |
|                                                                       |
| // \<TouchableOpacity onPress={() =\> setReportVisible(true)}\>       |
|                                                                       |
| // \<Ionicons name=\'ellipsis-horizontal\' size={20}                  |
| color=\'rgba(255,255,255,0.6)\' /\>                                   |
|                                                                       |
| // \</TouchableOpacity\>                                              |
|                                                                       |
| // Mount the modal:                                                   |
|                                                                       |
| // \<ReportModal                                                      |
|                                                                       |
| // postId={post.id}                                                   |
|                                                                       |
| // visible={reportVisible}                                            |
|                                                                       |
| // onClose={() =\> setReportVisible(false)}                           |
|                                                                       |
| // /\>                                                                |
+-----------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| **✅ Task 2 Done When:**                                              |
|                                                                       |
| ☑ 3-dot menu appears on all post cards                                |
|                                                                       |
| ☑ Reason selection list shows, submit button disabled until selection |
| made                                                                  |
|                                                                       |
| ☑ Success state shows after report submitted                          |
+-----------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| **TASK 3 · New Screen**                                               |
|                                                                       |
| **Outfit List View**                                                  |
+-----------------------------------------------------------------------+

Users can create outfits but have no way to view them. Add an Outfits
tab or section within wardrobe.tsx and a dedicated list screen. The most
natural placement is a tab inside wardrobe.tsx alongside the items grid.

+-----------------------------------------------------------------------+
| **🔗 API**                                                            |
|                                                                       |
| GET /wardrobe/outfits?page=1&limit=20 → { outfits: \[\...\],          |
| pagination: {\...} }                                                  |
+-----------------------------------------------------------------------+

**Option A --- Add Outfits tab inside wardrobe.tsx (recommended)**

+-----------------------------------------------------------------------+
| // app/wardrobe.tsx --- ADD outfits tab alongside items               |
|                                                                       |
| import { useState } from \'react\';                                   |
|                                                                       |
| import { useQuery } from \'@tanstack/react-query\';                   |
|                                                                       |
| const \[activeTab, setActiveTab\] = useState\<\'items\' \|            |
| \'outfits\'\>(\'items\');                                             |
|                                                                       |
| const { data: outfitsData, isLoading: outfitsLoading } = useQuery({   |
|                                                                       |
| queryKey: \[\'outfits\'\],                                            |
|                                                                       |
| queryFn: () =\> apiClient.get(\'/wardrobe/outfits?limit=50\').then(r  |
| =\> r.data),                                                          |
|                                                                       |
| enabled: activeTab === \'outfits\',                                   |
|                                                                       |
| });                                                                   |
|                                                                       |
| const outfits = outfitsData?.outfits ?? \[\];                         |
|                                                                       |
| // Tab bar UI (add below wardrobe header):                            |
|                                                                       |
| // \<View className=\'flex-row bg-white/5 rounded-full p-1 mx-4       |
| mb-4\'\>                                                              |
|                                                                       |
| // {\[\'items\',\'outfits\'\].map(tab =\> (                           |
|                                                                       |
| // \<TouchableOpacity                                                 |
|                                                                       |
| // key={tab}                                                          |
|                                                                       |
| // onPress={() =\> setActiveTab(tab as any)}                          |
|                                                                       |
| // className={\`flex-1 py-2 rounded-full items-center \${             |
| activeTab===tab ? \'bg-\[#FF6B35\]\' : \'\' }\`}                      |
|                                                                       |
| // \>                                                                 |
|                                                                       |
| // \<Text style={{ fontFamily: \'HelveticaNeue-Medium\' }}            |
|                                                                       |
| // className=\'text-white capitalize\'\>{tab}\</Text\>                |
|                                                                       |
| // \</TouchableOpacity\>                                              |
|                                                                       |
| // ))}                                                                |
|                                                                       |
| // \</View\>                                                          |
|                                                                       |
| // Outfits grid (2 columns, shown when activeTab === \'outfits\'):    |
|                                                                       |
| // Each outfit card: cover_image_url OR 2x2 grid of item images       |
|                                                                       |
| // Outfit name, occasion badge, item count                            |
|                                                                       |
| // Tap → navigate to /wardrobe/outfit-detail?id=outfit.id             |
+-----------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| // Outfit card component --- show cover image or item collage         |
|                                                                       |
| function OutfitCard({ outfit }: { outfit: any }) {                    |
|                                                                       |
| const router = useRouter();                                           |
|                                                                       |
| return (                                                              |
|                                                                       |
| \<TouchableOpacity                                                    |
|                                                                       |
| onPress={() =\>                                                       |
| router.push(\`/wardrobe/outfit-detail?id=\${outfit.id}\`)}            |
|                                                                       |
| className=\'flex-1 m-1 rounded-2xl overflow-hidden bg-white/5\'       |
|                                                                       |
| activeOpacity={0.85}                                                  |
|                                                                       |
| \>                                                                    |
|                                                                       |
| {outfit.cover_image_url ? (                                           |
|                                                                       |
| \<Image                                                               |
|                                                                       |
| source={{ uri: outfit.cover_image_url }}                              |
|                                                                       |
| className=\'w-full aspect-square\'                                    |
|                                                                       |
| /\>                                                                   |
|                                                                       |
| ) : (                                                                 |
|                                                                       |
| // 2x2 item image collage when no cover                               |
|                                                                       |
| \<View className=\'w-full aspect-square flex-row flex-wrap\'\>        |
|                                                                       |
| {(outfit.items ?? \[\]).slice(0, 4).map((item: any, i: number) =\> (  |
|                                                                       |
| \<Image                                                               |
|                                                                       |
| key={i}                                                               |
|                                                                       |
| source={{ uri: item.image_url }}                                      |
|                                                                       |
| className=\'w-1/2 h-1/2\'                                             |
|                                                                       |
| /\>                                                                   |
|                                                                       |
| ))}                                                                   |
|                                                                       |
| \</View\>                                                             |
|                                                                       |
| )}                                                                    |
|                                                                       |
| \<View className=\'p-2\'\>                                            |
|                                                                       |
| \<Text style={{ fontFamily: \'HelveticaNeue-Medium\' }}               |
|                                                                       |
| className=\'text-white text-sm\' numberOfLines={1}\>                  |
|                                                                       |
| {outfit.name \|\| \'Untitled Outfit\'}                                |
|                                                                       |
| \</Text\>                                                             |
|                                                                       |
| {outfit.occasion && (                                                 |
|                                                                       |
| \<Text className=\'text-\[#FF6B35\] text-xs mt-0.5 capitalize\'\>     |
|                                                                       |
| {outfit.occasion}                                                     |
|                                                                       |
| \</Text\>                                                             |
|                                                                       |
| )}                                                                    |
|                                                                       |
| \</View\>                                                             |
|                                                                       |
| \</TouchableOpacity\>                                                 |
|                                                                       |
| );                                                                    |
|                                                                       |
| }                                                                     |
|                                                                       |
| // Render in outfits tab:                                             |
|                                                                       |
| // \<FlatList                                                         |
|                                                                       |
| // data={outfits}                                                     |
|                                                                       |
| // numColumns={2}                                                     |
|                                                                       |
| // renderItem={({ item }) =\> \<OutfitCard outfit={item} /\>}         |
|                                                                       |
| // keyExtractor={(item) =\> item.id}                                  |
|                                                                       |
| // ListEmptyComponent={                                               |
|                                                                       |
| // \<EmptyState                                                       |
|                                                                       |
| // icon=\'shirt-outline\'                                             |
|                                                                       |
| // title=\'No outfits yet\'                                           |
|                                                                       |
| // subtitle=\'Create your first outfit from your wardrobe items\'     |
|                                                                       |
| // actionLabel=\'Create Outfit\'                                      |
|                                                                       |
| // onAction={() =\> router.push(\'/wardrobe/outfit-create\')}         |
|                                                                       |
| // /\>                                                                |
|                                                                       |
| // }                                                                  |
|                                                                       |
| // /\>                                                                |
+-----------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| **✅ Task 3 Done When:**                                              |
|                                                                       |
| ☑ Outfits tab visible in wardrobe screen                              |
|                                                                       |
| ☑ Created outfits appear as cards in a 2-column grid                  |
|                                                                       |
| ☑ Empty state shows with \'Create Outfit\' button when no outfits     |
| exist                                                                 |
+-----------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| **TASK 4 · New Screen**                                               |
|                                                                       |
| **Outfit Detail View**                                                |
+-----------------------------------------------------------------------+

Create app/wardrobe/outfit-detail.tsx. This is where the user sees all
items in an outfit, the AI rating, and can save/edit/delete the outfit.

+-----------------------------------------------------------------------+
| **🔗 API**                                                            |
|                                                                       |
| GET /wardrobe/outfits/:id → { outfit: { id, name, occasion, items:    |
| \[\...\], ai_rating, ai_feedback, \... } }                            |
+-----------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| **🎨 UI / Styling**                                                   |
|                                                                       |
| Layout: Header with back arrow + edit icon (pencil, white/60) +       |
| delete icon (trash, white/60). Top section: outfit name               |
| (HelveticaNeue-Bold, large) + occasion chip.                          |
|                                                                       |
| AI Rating card: show ai_rating score (large number,                   |
| HelveticaNeue-Light), ai_feedback text below. If ai_rating is null:   |
| \'AI rating in progress\...\' with ActivityIndicator.                 |
|                                                                       |
| Items section: horizontal ScrollView of item cards (image + name +    |
| category chip). Each item tappable → navigates to                     |
| /wardrobe/item-detail?id=itemId.                                      |
+-----------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| // app/wardrobe/outfit-detail.tsx                                     |
|                                                                       |
| import { useLocalSearchParams, useRouter } from \'expo-router\';      |
|                                                                       |
| import { useQuery, useMutation, useQueryClient } from                 |
| \'@tanstack/react-query\';                                            |
|                                                                       |
| import { Alert, ScrollView, View, Text, Image, TouchableOpacity }     |
| from \'react-native\';                                                |
|                                                                       |
| import { SafeAreaView } from \'react-native-safe-area-context\';      |
|                                                                       |
| import { Ionicons } from \'@expo/vector-icons\';                      |
|                                                                       |
| import { apiClient } from \'../../src/lib/apiClient\';                |
|                                                                       |
| export default function OutfitDetail() {                              |
|                                                                       |
| const { id } = useLocalSearchParams\<{ id: string }\>();              |
|                                                                       |
| const router = useRouter();                                           |
|                                                                       |
| const qc = useQueryClient();                                          |
|                                                                       |
| const { data, isLoading } = useQuery({                                |
|                                                                       |
| queryKey: \[\'outfit\', id\],                                         |
|                                                                       |
| queryFn: () =\> apiClient.get(\`/wardrobe/outfits/\${id}\`).then(r    |
| =\> r.data),                                                          |
|                                                                       |
| });                                                                   |
|                                                                       |
| const outfit = data?.outfit;                                          |
|                                                                       |
| const deleteMutation = useMutation({                                  |
|                                                                       |
| mutationFn: () =\> apiClient.delete(\`/wardrobe/outfits/\${id}\`),    |
|                                                                       |
| onSuccess: () =\> {                                                   |
|                                                                       |
| qc.invalidateQueries({ queryKey: \[\'outfits\'\] });                  |
|                                                                       |
| router.back();                                                        |
|                                                                       |
| },                                                                    |
|                                                                       |
| });                                                                   |
|                                                                       |
| const handleDelete = () =\> {                                         |
|                                                                       |
| Alert.alert(                                                          |
|                                                                       |
| \'Delete Outfit\',                                                    |
|                                                                       |
| \'This outfit will be permanently deleted.\',                         |
|                                                                       |
| \[                                                                    |
|                                                                       |
| { text: \'Cancel\', style: \'cancel\' },                              |
|                                                                       |
| { text: \'Delete\', style: \'destructive\',                           |
|                                                                       |
| onPress: () =\> deleteMutation.mutate() },                            |
|                                                                       |
| \]                                                                    |
|                                                                       |
| );                                                                    |
|                                                                       |
| };                                                                    |
|                                                                       |
| if (isLoading \|\| !outfit) {                                         |
|                                                                       |
| return (                                                              |
|                                                                       |
| \<SafeAreaView className=\'flex-1 bg-black items-center               |
| justify-center\'\>                                                    |
|                                                                       |
| \<ActivityIndicator color=\'#FF6B35\' /\>                             |
|                                                                       |
| \</SafeAreaView\>                                                     |
|                                                                       |
| );                                                                    |
|                                                                       |
| }                                                                     |
|                                                                       |
| return (                                                              |
|                                                                       |
| \<SafeAreaView className=\'flex-1 bg-black\'\>                        |
|                                                                       |
| {/\* Header \*/}                                                      |
|                                                                       |
| \<View className=\'flex-row items-center justify-between px-4         |
| py-3\'\>                                                              |
|                                                                       |
| \<TouchableOpacity onPress={() =\> router.back()}\>                   |
|                                                                       |
| \<Ionicons name=\'arrow-back\' size={24} color=\'white\' /\>          |
|                                                                       |
| \</TouchableOpacity\>                                                 |
|                                                                       |
| \<View className=\'flex-row gap-4\'\>                                 |
|                                                                       |
| \<TouchableOpacity                                                    |
|                                                                       |
| onPress={() =\> router.push(\`/wardrobe/outfit-edit?id=\${id}\`)}     |
|                                                                       |
| \>                                                                    |
|                                                                       |
| \<Ionicons name=\'pencil-outline\' size={22}                          |
| color=\'rgba(255,255,255,0.6)\' /\>                                   |
|                                                                       |
| \</TouchableOpacity\>                                                 |
|                                                                       |
| \<TouchableOpacity onPress={handleDelete}\>                           |
|                                                                       |
| \<Ionicons name=\'trash-outline\' size={22}                           |
| color=\'rgba(255,255,255,0.6)\' /\>                                   |
|                                                                       |
| \</TouchableOpacity\>                                                 |
|                                                                       |
| \</View\>                                                             |
|                                                                       |
| \</View\>                                                             |
|                                                                       |
| \<ScrollView contentContainerStyle={{ paddingBottom: 100 }}\>         |
|                                                                       |
| {/\* Outfit name + occasion \*/}                                      |
|                                                                       |
| \<View className=\'px-4 mb-6\'\>                                      |
|                                                                       |
| \<Text style={{ fontFamily: \'HelveticaNeue-Bold\' }}                 |
|                                                                       |
| className=\'text-white text-2xl\'\>                                   |
|                                                                       |
| {outfit.name \|\| \'Untitled Outfit\'}                                |
|                                                                       |
| \</Text\>                                                             |
|                                                                       |
| {outfit.occasion && (                                                 |
|                                                                       |
| \<View className=\'mt-2 self-start bg-\[#FF6B35\]/20 border           |
| border-\[#FF6B35\]/50 rounded-full px-3 py-1\'\>                      |
|                                                                       |
| \<Text className=\'text-\[#FF6B35\] text-xs                           |
| capitalize\'\>{outfit.occasion}\</Text\>                              |
|                                                                       |
| \</View\>                                                             |
|                                                                       |
| )}                                                                    |
|                                                                       |
| \</View\>                                                             |
|                                                                       |
| {/\* AI Rating card \*/}                                              |
|                                                                       |
| \<View className=\'mx-4 mb-6 bg-white/5 rounded-2xl p-4 border        |
| border-white/10\'\>                                                   |
|                                                                       |
| \<Text style={{ fontFamily: \'HelveticaNeue-Medium\' }}               |
|                                                                       |
| className=\'text-white/60 text-xs mb-2\'\>AI RATING\</Text\>          |
|                                                                       |
| {outfit.ai_rating ? (                                                 |
|                                                                       |
| \<\>                                                                  |
|                                                                       |
| \<Text style={{ fontFamily: \'HelveticaNeue-Light\' }}                |
|                                                                       |
| className=\'text-\[#FF6B35\] text-4xl\'\>                             |
|                                                                       |
| {outfit.ai_rating.toFixed(1)}                                         |
|                                                                       |
| \<Text className=\'text-white/40 text-base\'\> / 10\</Text\>          |
|                                                                       |
| \</Text\>                                                             |
|                                                                       |
| {outfit.ai_feedback && (                                              |
|                                                                       |
| \<Text className=\'text-white/60 text-sm                              |
| mt-2\'\>{outfit.ai_feedback}\</Text\>                                 |
|                                                                       |
| )}                                                                    |
|                                                                       |
| \</\>                                                                 |
|                                                                       |
| ) : (                                                                 |
|                                                                       |
| \<View className=\'flex-row items-center gap-2\'\>                    |
|                                                                       |
| \<ActivityIndicator size=\'small\' color=\'#FF6B35\' /\>              |
|                                                                       |
| \<Text className=\'text-white/40 text-sm\'\>AI rating in              |
| progress\...\</Text\>                                                 |
|                                                                       |
| \</View\>                                                             |
|                                                                       |
| )}                                                                    |
|                                                                       |
| \</View\>                                                             |
|                                                                       |
| {/\* Items horizontal scroll \*/}                                     |
|                                                                       |
| \<Text style={{ fontFamily: \'HelveticaNeue-Medium\' }}               |
|                                                                       |
| className=\'text-white/60 text-xs px-4 mb-3\'\>ITEMS IN THIS          |
| OUTFIT\</Text\>                                                       |
|                                                                       |
| \<ScrollView horizontal showsHorizontalScrollIndicator={false}        |
|                                                                       |
| contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}\>          |
|                                                                       |
| {(outfit.items ?? \[\]).map((item: any) =\> (                         |
|                                                                       |
| \<TouchableOpacity                                                    |
|                                                                       |
| key={item.id}                                                         |
|                                                                       |
| onPress={() =\>                                                       |
| router.push(\`/wardrobe/item-detail?id=\${item.id}\`)}                |
|                                                                       |
| className=\'w-28\'                                                    |
|                                                                       |
| \>                                                                    |
|                                                                       |
| \<Image                                                               |
|                                                                       |
| source={{ uri: item.image_url }}                                      |
|                                                                       |
| className=\'w-28 h-28 rounded-xl\'                                    |
|                                                                       |
| /\>                                                                   |
|                                                                       |
| \<Text style={{ fontFamily: \'HelveticaNeue-Medium\' }}               |
|                                                                       |
| className=\'text-white text-xs mt-1\' numberOfLines={1}\>             |
|                                                                       |
| {item.name \|\| item.fashionclip_main_category \|\| \'Item\'}         |
|                                                                       |
| \</Text\>                                                             |
|                                                                       |
| \</TouchableOpacity\>                                                 |
|                                                                       |
| ))}                                                                   |
|                                                                       |
| \</ScrollView\>                                                       |
|                                                                       |
| \</ScrollView\>                                                       |
|                                                                       |
| \</SafeAreaView\>                                                     |
|                                                                       |
| );                                                                    |
|                                                                       |
| }                                                                     |
+-----------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| **✅ Task 4 Done When:**                                              |
|                                                                       |
| ☑ Tapping an outfit card in the list navigates to this screen         |
|                                                                       |
| ☑ All outfit items visible in horizontal scroll                       |
|                                                                       |
| ☑ AI rating displayed or loading indicator shown                      |
|                                                                       |
| ☑ Delete works and navigates back to outfits list                     |
+-----------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| **TASK 5 · Wire up existing APIs**                                    |
|                                                                       |
| **Outfit Edit + Delete**                                              |
+-----------------------------------------------------------------------+

Delete is already wired in outfit-detail.tsx above (Task 4). This task
covers the edit flow --- a simple screen that patches the outfit name,
occasion, and item list.

+-----------------------------------------------------------------------+
| **🔗 API**                                                            |
|                                                                       |
| PATCH /wardrobe/outfits/:id { name?, occasion?, item_ids?: string\[\] |
| } → 200 { outfit }                                                    |
|                                                                       |
| DELETE /wardrobe/outfits/:id → 200 { success: true } (wired in Task   |
| 4)                                                                    |
+-----------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| **🎨 UI / Styling**                                                   |
|                                                                       |
| Layout: Same structure as outfit-create.tsx. Pre-fill name field and  |
| occasion picker from current outfit data. Show current items          |
| pre-selected (orange border). User can add/remove items. \'Save       |
| Changes\' primary button.                                             |
+-----------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| // app/wardrobe/outfit-edit.tsx                                       |
|                                                                       |
| import { useLocalSearchParams, useRouter } from \'expo-router\';      |
|                                                                       |
| import { useQuery, useMutation, useQueryClient } from                 |
| \'@tanstack/react-query\';                                            |
|                                                                       |
| import { useState, useEffect } from \'react\';                        |
|                                                                       |
| import { apiClient } from \'../../src/lib/apiClient\';                |
|                                                                       |
| export default function OutfitEdit() {                                |
|                                                                       |
| const { id } = useLocalSearchParams\<{ id: string }\>();              |
|                                                                       |
| const router = useRouter();                                           |
|                                                                       |
| const qc = useQueryClient();                                          |
|                                                                       |
| // Load current outfit data                                           |
|                                                                       |
| const { data } = useQuery({                                           |
|                                                                       |
| queryKey: \[\'outfit\', id\],                                         |
|                                                                       |
| queryFn: () =\> apiClient.get(\`/wardrobe/outfits/\${id}\`).then(r    |
| =\> r.data),                                                          |
|                                                                       |
| });                                                                   |
|                                                                       |
| // Load wardrobe items for selection                                  |
|                                                                       |
| const { data: wardrobeData } = useQuery({                             |
|                                                                       |
| queryKey: \[\'wardrobe-items\'\],                                     |
|                                                                       |
| queryFn: () =\> apiClient.get(\'/wardrobe/items?limit=100\').then(r   |
| =\> r.data),                                                          |
|                                                                       |
| });                                                                   |
|                                                                       |
| const \[name, setName\] = useState(\'\');                             |
|                                                                       |
| const \[occasion, setOccasion\] = useState(\'\');                     |
|                                                                       |
| const \[selectedIds, setSelectedIds\] = useState\<string\[\]\>(\[\]); |
|                                                                       |
| // Pre-fill from loaded outfit                                        |
|                                                                       |
| useEffect(() =\> {                                                    |
|                                                                       |
| if (data?.outfit) {                                                   |
|                                                                       |
| setName(data.outfit.name \|\| \'\');                                  |
|                                                                       |
| setOccasion(data.outfit.occasion \|\| \'\');                          |
|                                                                       |
| setSelectedIds((data.outfit.items ?? \[\]).map((i: any) =\> i.id));   |
|                                                                       |
| }                                                                     |
|                                                                       |
| }, \[data\]);                                                         |
|                                                                       |
| const updateMutation = useMutation({                                  |
|                                                                       |
| mutationFn: () =\> apiClient.patch(\`/wardrobe/outfits/\${id}\`, {    |
|                                                                       |
| name: name \|\| undefined,                                            |
|                                                                       |
| occasion: occasion \|\| undefined,                                    |
|                                                                       |
| item_ids: selectedIds,                                                |
|                                                                       |
| }),                                                                   |
|                                                                       |
| onSuccess: () =\> {                                                   |
|                                                                       |
| qc.invalidateQueries({ queryKey: \[\'outfit\', id\] });               |
|                                                                       |
| qc.invalidateQueries({ queryKey: \[\'outfits\'\] });                  |
|                                                                       |
| router.back();                                                        |
|                                                                       |
| },                                                                    |
|                                                                       |
| });                                                                   |
|                                                                       |
| const toggleItem = (itemId: string) =\> {                             |
|                                                                       |
| setSelectedIds(prev =\>                                               |
|                                                                       |
| prev.includes(itemId)                                                 |
|                                                                       |
| ? prev.filter(i =\> i !== itemId)                                     |
|                                                                       |
| : \[\...prev, itemId\]                                                |
|                                                                       |
| );                                                                    |
|                                                                       |
| };                                                                    |
|                                                                       |
| const items = wardrobeData?.items ?? \[\];                            |
|                                                                       |
| // Render: same layout as outfit-create.tsx                           |
|                                                                       |
| // Items grid with selectedIds determining orange border              |
|                                                                       |
| // Name input pre-filled, occasion picker pre-selected                |
|                                                                       |
| // \'Save Changes\' button calls updateMutation.mutate()              |
|                                                                       |
| // Disable save if selectedIds.length === 0                           |
|                                                                       |
| return null; // Replace with your actual JSX                          |
|                                                                       |
| }                                                                     |
+-----------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| **✅ Task 5 Done When:**                                              |
|                                                                       |
| ☑ Pencil icon in outfit-detail.tsx navigates to outfit-edit.tsx       |
|                                                                       |
| ☑ Edit screen pre-fills with current outfit name, occasion, and       |
| selected items                                                        |
|                                                                       |
| ☑ Save updates the outfit and returns to detail view with updated     |
| data                                                                  |
+-----------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| **TASK 6 · New Screen**                                               |
|                                                                       |
| **Vendor Product Creation**                                           |
+-----------------------------------------------------------------------+

This is the most important missing piece. Without it, vendors can
register but have nothing to sell. The product creation screen needs to
handle name, description, category, price, stock, condition, and image
upload. Products start as draft and are activated in Task 7.

+-----------------------------------------------------------------------+
| **🔗 API**                                                            |
|                                                                       |
| POST /products { name, description?, category, price,                 |
| stock_quantity?, condition?, tags? } → 201 { product }                |
|                                                                       |
| POST /products/:id/images { image_path, is_primary? } → 201 { image } |
| (multipart form)                                                      |
+-----------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| **🎨 UI / Styling**                                                   |
|                                                                       |
| Layout: Header \'New Product\' + back. Section 1: Images ---          |
| horizontal scrollable row of image slots (up to 6). Tap a slot to     |
| pick image. First slot = primary. Section 2: Details form --- Name,   |
| Description (multiline), Category (picker), Brand (optional),         |
| Condition (picker), Price (numeric), Stock Quantity (numeric). Tags   |
| input (comma-separated, optional). \'Save as Draft\' + \'Publish      |
| Now\' buttons at bottom.                                              |
|                                                                       |
| Image slots: show dashed border + plus icon when empty, show uploaded |
| image when filled. \'Primary\' badge on first image.                  |
+-----------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| // app/vendor/product-create.tsx                                      |
|                                                                       |
| import { useState } from \'react\';                                   |
|                                                                       |
| import { View, Text, TextInput, ScrollView, TouchableOpacity, Alert } |
| from \'react-native\';                                                |
|                                                                       |
| import { SafeAreaView } from \'react-native-safe-area-context\';      |
|                                                                       |
| import { useRouter } from \'expo-router\';                            |
|                                                                       |
| import { useMutation, useQueryClient } from                           |
| \'@tanstack/react-query\';                                            |
|                                                                       |
| import \* as ImagePicker from \'expo-image-picker\';                  |
|                                                                       |
| import { Ionicons } from \'@expo/vector-icons\';                      |
|                                                                       |
| import { apiClient } from \'../../src/lib/apiClient\';                |
|                                                                       |
| const CATEGORIES = \[                                                 |
|                                                                       |
| \'tops\',\'bottoms\',\'outerwear\',\'footwear\',\'accessories\',      |
|                                                                       |
| \                                                                     |
| 'dresses\',\'bags\',\'jewelry\',\'activewear\',\'swimwear\',\'other\' |
|                                                                       |
| \];                                                                   |
|                                                                       |
| const CONDITIONS =                                                    |
| \[\'new\',\'like_new\',\'good\',\'fair\',\'poor\'\];                  |
|                                                                       |
| export default function ProductCreate() {                             |
|                                                                       |
| const router = useRouter();                                           |
|                                                                       |
| const qc = useQueryClient();                                          |
|                                                                       |
| const \[name, setName\] = useState(\'\');                             |
|                                                                       |
| const \[description, setDescription\] = useState(\'\');               |
|                                                                       |
| const \[category, setCategory\] = useState(\'\');                     |
|                                                                       |
| const \[condition, setCondition\] = useState(\'new\');                |
|                                                                       |
| const \[price, setPrice\] = useState(\'\');                           |
|                                                                       |
| const \[stock, setStock\] = useState(\'1\');                          |
|                                                                       |
| const \[tags, setTags\] = useState(\'\');                             |
|                                                                       |
| const \[images, setImages\] = useState\<Array\<{uri:string;           |
| path:string}\>\>(\[\]);                                               |
|                                                                       |
| const \[uploading, setUploading\] = useState(false);                  |
|                                                                       |
| // Step 1: Create product (draft)                                     |
|                                                                       |
| const createMutation = useMutation({                                  |
|                                                                       |
| mutationFn: (publish: boolean) =\> apiClient.post(\'/products\', {    |
|                                                                       |
| name,                                                                 |
|                                                                       |
| description: description \|\| undefined,                              |
|                                                                       |
| category,                                                             |
|                                                                       |
| condition,                                                            |
|                                                                       |
| price: parseFloat(price),                                             |
|                                                                       |
| stock_quantity: parseInt(stock) \|\| 1,                               |
|                                                                       |
| tags: tags ? tags.split(\',\').map(t =\> t.trim()).filter(Boolean) :  |
| \[\],                                                                 |
|                                                                       |
| // Status set to \'active\' if publish=true, else stays \'draft\'     |
|                                                                       |
| }),                                                                   |
|                                                                       |
| onSuccess: async (res, publish) =\> {                                 |
|                                                                       |
| const productId = res.data.product.id;                                |
|                                                                       |
| // Step 2: Upload images if any                                       |
|                                                                       |
| if (images.length \> 0) {                                             |
|                                                                       |
| setUploading(true);                                                   |
|                                                                       |
| for (let i = 0; i \< images.length; i++) {                            |
|                                                                       |
| const form = new FormData();                                          |
|                                                                       |
| form.append(\'file\', {                                               |
|                                                                       |
| uri: images\[i\].uri,                                                 |
|                                                                       |
| name: images\[i\].path.split(\'/\').pop() \|\| \'product.jpg\',       |
|                                                                       |
| type: \'image/jpeg\',                                                 |
|                                                                       |
| } as any);                                                            |
|                                                                       |
| form.append(\'is_primary\', String(i === 0));                         |
|                                                                       |
| await apiClient.post(\`/products/\${productId}/images\`, form, {      |
|                                                                       |
| headers: { \'Content-Type\': \'multipart/form-data\' },               |
|                                                                       |
| });                                                                   |
|                                                                       |
| }                                                                     |
|                                                                       |
| setUploading(false);                                                  |
|                                                                       |
| }                                                                     |
|                                                                       |
| // Step 3: Activate if publish                                        |
|                                                                       |
| if (publish) {                                                        |
|                                                                       |
| await apiClient.patch(\`/products/\${productId}\`, { status:          |
| \'active\' });                                                        |
|                                                                       |
| }                                                                     |
|                                                                       |
| qc.invalidateQueries({ queryKey: \[\'vendor-products\'\] });          |
|                                                                       |
| router.back();                                                        |
|                                                                       |
| },                                                                    |
|                                                                       |
| onError: () =\> Alert.alert(\'Error\', \'Could not create             |
| product.\'),                                                          |
|                                                                       |
| });                                                                   |
|                                                                       |
| const pickImage = async () =\> {                                      |
|                                                                       |
| if (images.length \>= 6) {                                            |
|                                                                       |
| Alert.alert(\'Max images\', \'You can upload up to 6 images.\');      |
|                                                                       |
| return;                                                               |
|                                                                       |
| }                                                                     |
|                                                                       |
| const result = await ImagePicker.launchImageLibraryAsync({            |
|                                                                       |
| mediaTypes: ImagePicker.MediaTypeOptions.Images,                      |
|                                                                       |
| quality: 0.85,                                                        |
|                                                                       |
| });                                                                   |
|                                                                       |
| if (!result.canceled) {                                               |
|                                                                       |
| const uri = result.assets\[0\].uri;                                   |
|                                                                       |
| const path = \`product-\${Date.now()}-\${images.length}.jpg\`;        |
|                                                                       |
| setImages(prev =\> \[\...prev, { uri, path }\]);                      |
|                                                                       |
| }                                                                     |
|                                                                       |
| };                                                                    |
|                                                                       |
| const canSubmit = name.trim() && category && parseFloat(price) \> 0;  |
|                                                                       |
| return (                                                              |
|                                                                       |
| \<SafeAreaView className=\'flex-1 bg-black\'\>                        |
|                                                                       |
| {/\* Header \*/}                                                      |
|                                                                       |
| \<View className=\'flex-row items-center px-4 py-3 border-b           |
| border-white/10\'\>                                                   |
|                                                                       |
| \<TouchableOpacity onPress={() =\> router.back()}\>                   |
|                                                                       |
| \<Ionicons name=\'arrow-back\' size={24} color=\'white\' /\>          |
|                                                                       |
| \</TouchableOpacity\>                                                 |
|                                                                       |
| \<Text style={{ fontFamily: \'HelveticaNeue-Bold\' }}                 |
|                                                                       |
| className=\'text-white text-lg ml-4\'\>New Product\</Text\>           |
|                                                                       |
| \</View\>                                                             |
|                                                                       |
| \<ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 |
| }}\>                                                                  |
|                                                                       |
| {/\* Image slots \*/}                                                 |
|                                                                       |
| \<Text style={{ fontFamily: \'HelveticaNeue-Medium\' }}               |
|                                                                       |
| className=\'text-white/60 text-xs mb-3\'\>PHOTOS (UP TO 6)\</Text\>   |
|                                                                       |
| \<ScrollView horizontal showsHorizontalScrollIndicator={false}        |
|                                                                       |
| className=\'mb-6\' contentContainerStyle={{ gap: 8 }}\>               |
|                                                                       |
| {images.map((img, i) =\> (                                            |
|                                                                       |
| \<View key={i} className=\'relative\'\>                               |
|                                                                       |
| \<Image source={{ uri: img.uri }} className=\'w-24 h-24 rounded-xl\'  |
| /\>                                                                   |
|                                                                       |
| {i === 0 && (                                                         |
|                                                                       |
| \<View className=\'absolute top-1 left-1 bg-\[#FF6B35\] rounded       |
| px-1\'\>                                                              |
|                                                                       |
| \<Text className=\'text-white text-xs\'\>Primary\</Text\>             |
|                                                                       |
| \</View\>                                                             |
|                                                                       |
| )}                                                                    |
|                                                                       |
| \<TouchableOpacity                                                    |
|                                                                       |
| onPress={() =\> setImages(prev =\> prev.filter((\_, j) =\> j !== i))} |
|                                                                       |
| className=\'absolute -top-2 -right-2 bg-red-500 rounded-full w-5 h-5  |
| items-center justify-center\'                                         |
|                                                                       |
| \>                                                                    |
|                                                                       |
| \<Ionicons name=\'close\' size={12} color=\'white\' /\>               |
|                                                                       |
| \</TouchableOpacity\>                                                 |
|                                                                       |
| \</View\>                                                             |
|                                                                       |
| ))}                                                                   |
|                                                                       |
| {images.length \< 6 && (                                              |
|                                                                       |
| \<TouchableOpacity                                                    |
|                                                                       |
| onPress={pickImage}                                                   |
|                                                                       |
| className=\'w-24 h-24 rounded-xl border border-dashed border-white/30 |
| items-center justify-center\'                                         |
|                                                                       |
| \>                                                                    |
|                                                                       |
| \<Ionicons name=\'add\' size={28} color=\'rgba(255,255,255,0.4)\' /\> |
|                                                                       |
| \</TouchableOpacity\>                                                 |
|                                                                       |
| )}                                                                    |
|                                                                       |
| \</ScrollView\>                                                       |
|                                                                       |
| {/\* Name \*/}                                                        |
|                                                                       |
| \<Text style={{ fontFamily: \'HelveticaNeue-Medium\' }}               |
|                                                                       |
| className=\'text-white/60 text-xs mb-2\'\>PRODUCT NAME \*\</Text\>    |
|                                                                       |
| \<View className=\'bg-white/10 rounded-xl px-4 py-4 border            |
| border-white/20 mb-4\'\>                                              |
|                                                                       |
| \<TextInput                                                           |
|                                                                       |
| value={name}                                                          |
|                                                                       |
| onChangeText={setName}                                                |
|                                                                       |
| placeholder=\'e.g. Summer Floral Dress\'                              |
|                                                                       |
| placeholderTextColor=\'rgba(255,255,255,0.3)\'                        |
|                                                                       |
| className=\'text-white\'                                              |
|                                                                       |
| style={{ fontFamily: \'HelveticaNeue-Roman\' }}                       |
|                                                                       |
| /\>                                                                   |
|                                                                       |
| \</View\>                                                             |
|                                                                       |
| {/\* Description \*/}                                                 |
|                                                                       |
| \<Text style={{ fontFamily: \'HelveticaNeue-Medium\' }}               |
|                                                                       |
| className=\'text-white/60 text-xs mb-2\'\>DESCRIPTION\</Text\>        |
|                                                                       |
| \<View className=\'bg-white/10 rounded-xl px-4 py-4 border            |
| border-white/20 mb-4\'\>                                              |
|                                                                       |
| \<TextInput                                                           |
|                                                                       |
| value={description}                                                   |
|                                                                       |
| onChangeText={setDescription}                                         |
|                                                                       |
| placeholder=\'Describe your product\...\'                             |
|                                                                       |
| placeholderTextColor=\'rgba(255,255,255,0.3)\'                        |
|                                                                       |
| multiline                                                             |
|                                                                       |
| numberOfLines={3}                                                     |
|                                                                       |
| className=\'text-white\'                                              |
|                                                                       |
| style={{ fontFamily: \'HelveticaNeue-Roman\', minHeight: 80 }}        |
|                                                                       |
| /\>                                                                   |
|                                                                       |
| \</View\>                                                             |
|                                                                       |
| {/\* Category picker \*/}                                             |
|                                                                       |
| \<Text style={{ fontFamily: \'HelveticaNeue-Medium\' }}               |
|                                                                       |
| className=\'text-white/60 text-xs mb-2\'\>CATEGORY \*\</Text\>        |
|                                                                       |
| \<ScrollView horizontal showsHorizontalScrollIndicator={false}        |
|                                                                       |
| className=\'mb-4\' contentContainerStyle={{ gap: 8 }}\>               |
|                                                                       |
| {CATEGORIES.map(cat =\> (                                             |
|                                                                       |
| \<TouchableOpacity                                                    |
|                                                                       |
| key={cat}                                                             |
|                                                                       |
| onPress={() =\> setCategory(cat)}                                     |
|                                                                       |
| className={\`px-4 py-2 rounded-full border \${ category===cat         |
|                                                                       |
| ? \'bg-\[#FF6B35\] border-\[#FF6B35\]\'                               |
|                                                                       |
| : \'bg-white/5 border-white/20\' }\`}                                 |
|                                                                       |
| \>                                                                    |
|                                                                       |
| \<Text style={{ fontFamily: \'HelveticaNeue-Medium\' }}               |
|                                                                       |
| className=\'text-white capitalize\'\>{cat}\</Text\>                   |
|                                                                       |
| \</TouchableOpacity\>                                                 |
|                                                                       |
| ))}                                                                   |
|                                                                       |
| \</ScrollView\>                                                       |
|                                                                       |
| {/\* Condition \*/}                                                   |
|                                                                       |
| \<Text style={{ fontFamily: \'HelveticaNeue-Medium\' }}               |
|                                                                       |
| className=\'text-white/60 text-xs mb-2\'\>CONDITION\</Text\>          |
|                                                                       |
| \<ScrollView horizontal showsHorizontalScrollIndicator={false}        |
|                                                                       |
| className=\'mb-4\' contentContainerStyle={{ gap: 8 }}\>               |
|                                                                       |
| {CONDITIONS.map(c =\> (                                               |
|                                                                       |
| \<TouchableOpacity                                                    |
|                                                                       |
| key={c}                                                               |
|                                                                       |
| onPress={() =\> setCondition(c)}                                      |
|                                                                       |
| className={\`px-4 py-2 rounded-full border \${ condition===c          |
|                                                                       |
| ? \'bg-\[#FF6B35\] border-\[#FF6B35\]\'                               |
|                                                                       |
| : \'bg-white/5 border-white/20\' }\`}                                 |
|                                                                       |
| \>                                                                    |
|                                                                       |
| \<Text style={{ fontFamily: \'HelveticaNeue-Medium\' }}               |
|                                                                       |
| className=\'text-white capitalize\'\>{c.replace(\'\_\',\'             |
| \')}\</Text\>                                                         |
|                                                                       |
| \</TouchableOpacity\>                                                 |
|                                                                       |
| ))}                                                                   |
|                                                                       |
| \</ScrollView\>                                                       |
|                                                                       |
| {/\* Price + Stock row \*/}                                           |
|                                                                       |
| \<View className=\'flex-row gap-3 mb-4\'\>                            |
|                                                                       |
| \<View className=\'flex-1\'\>                                         |
|                                                                       |
| \<Text style={{ fontFamily: \'HelveticaNeue-Medium\' }}               |
|                                                                       |
| className=\'text-white/60 text-xs mb-2\'\>PRICE (PKR) \*\</Text\>     |
|                                                                       |
| \<View className=\'bg-white/10 rounded-xl px-4 py-4 border            |
| border-white/20\'\>                                                   |
|                                                                       |
| \<TextInput                                                           |
|                                                                       |
| value={price}                                                         |
|                                                                       |
| onChangeText={setPrice}                                               |
|                                                                       |
| placeholder=\'0\'                                                     |
|                                                                       |
| placeholderTextColor=\'rgba(255,255,255,0.3)\'                        |
|                                                                       |
| keyboardType=\'numeric\'                                              |
|                                                                       |
| className=\'text-white\'                                              |
|                                                                       |
| style={{ fontFamily: \'HelveticaNeue-Roman\' }}                       |
|                                                                       |
| /\>                                                                   |
|                                                                       |
| \</View\>                                                             |
|                                                                       |
| \</View\>                                                             |
|                                                                       |
| \<View className=\'flex-1\'\>                                         |
|                                                                       |
| \<Text style={{ fontFamily: \'HelveticaNeue-Medium\' }}               |
|                                                                       |
| className=\'text-white/60 text-xs mb-2\'\>STOCK QTY\</Text\>          |
|                                                                       |
| \<View className=\'bg-white/10 rounded-xl px-4 py-4 border            |
| border-white/20\'\>                                                   |
|                                                                       |
| \<TextInput                                                           |
|                                                                       |
| value={stock}                                                         |
|                                                                       |
| onChangeText={setStock}                                               |
|                                                                       |
| placeholder=\'1\'                                                     |
|                                                                       |
| placeholderTextColor=\'rgba(255,255,255,0.3)\'                        |
|                                                                       |
| keyboardType=\'numeric\'                                              |
|                                                                       |
| className=\'text-white\'                                              |
|                                                                       |
| style={{ fontFamily: \'HelveticaNeue-Roman\' }}                       |
|                                                                       |
| /\>                                                                   |
|                                                                       |
| \</View\>                                                             |
|                                                                       |
| \</View\>                                                             |
|                                                                       |
| \</View\>                                                             |
|                                                                       |
| {/\* Tags \*/}                                                        |
|                                                                       |
| \<Text style={{ fontFamily: \'HelveticaNeue-Medium\' }}               |
|                                                                       |
| className=\'text-white/60 text-xs mb-2\'\>TAGS                        |
| (comma-separated)\</Text\>                                            |
|                                                                       |
| \<View className=\'bg-white/10 rounded-xl px-4 py-4 border            |
| border-white/20 mb-8\'\>                                              |
|                                                                       |
| \<TextInput                                                           |
|                                                                       |
| value={tags}                                                          |
|                                                                       |
| onChangeText={setTags}                                                |
|                                                                       |
| placeholder=\'summer, floral, silk\...\'                              |
|                                                                       |
| placeholderTextColor=\'rgba(255,255,255,0.3)\'                        |
|                                                                       |
| className=\'text-white\'                                              |
|                                                                       |
| style={{ fontFamily: \'HelveticaNeue-Roman\' }}                       |
|                                                                       |
| /\>                                                                   |
|                                                                       |
| \</View\>                                                             |
|                                                                       |
| \</ScrollView\>                                                       |
|                                                                       |
| {/\* Bottom action bar \*/}                                           |
|                                                                       |
| \<View className=\'absolute bottom-0 left-0 right-0 p-4 bg-black      |
| border-t border-white/10 flex-row gap-3\'\>                           |
|                                                                       |
| \<TouchableOpacity                                                    |
|                                                                       |
| onPress={() =\> createMutation.mutate(false)}                         |
|                                                                       |
| disabled={!canSubmit \|\| createMutation.isPending \|\| uploading}    |
|                                                                       |
| className=\'flex-1 bg-white/10 rounded-full py-4 border               |
| border-white/20 items-center\'                                        |
|                                                                       |
| \>                                                                    |
|                                                                       |
| \<Text style={{ fontFamily: \'HelveticaNeue-Heavy\' }}                |
| className=\'text-white\'\>                                            |
|                                                                       |
| SAVE DRAFT                                                            |
|                                                                       |
| \</Text\>                                                             |
|                                                                       |
| \</TouchableOpacity\>                                                 |
|                                                                       |
| \<TouchableOpacity                                                    |
|                                                                       |
| onPress={() =\> createMutation.mutate(true)}                          |
|                                                                       |
| disabled={!canSubmit \|\| createMutation.isPending \|\| uploading}    |
|                                                                       |
| className=\'flex-1 bg-\[#FF6B35\] rounded-full py-4 items-center\'    |
|                                                                       |
| \>                                                                    |
|                                                                       |
| \<Text style={{ fontFamily: \'HelveticaNeue-Heavy\' }}                |
| className=\'text-white\'\>                                            |
|                                                                       |
| {createMutation.isPending \|\| uploading ? \'PUBLISHING\...\' :       |
| \'PUBLISH NOW\'}                                                      |
|                                                                       |
| \</Text\>                                                             |
|                                                                       |
| \</TouchableOpacity\>                                                 |
|                                                                       |
| \</View\>                                                             |
|                                                                       |
| \</SafeAreaView\>                                                     |
|                                                                       |
| );                                                                    |
|                                                                       |
| }                                                                     |
+-----------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| **⚠️ Note**                                                           |
|                                                                       |
| Add a link to this screen from vendor/inventory.tsx --- a floating    |
| \'+\' button (Ionicons add-circle, #FF6B35, large) bottom-right.      |
| onPress={() =\> router.push(\'/vendor/product-create\')}              |
+-----------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| **✅ Task 6 Done When:**                                              |
|                                                                       |
| ☑ \'+\' button in inventory.tsx navigates to product-create.tsx       |
|                                                                       |
| ☑ Name, category, price are required --- save buttons disabled if     |
| missing                                                               |
|                                                                       |
| ☑ Images can be added, removed, reordered (first = primary)           |
|                                                                       |
| ☑ \'Save Draft\' creates inactive product. \'Publish Now\' creates    |
| and activates it.                                                     |
|                                                                       |
| ☑ New product appears in vendor/inventory.tsx after creation          |
+-----------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| **TASK 7 · Wire up existing API**                                     |
|                                                                       |
| **Product Activate / Deactivate**                                     |
+-----------------------------------------------------------------------+

Products created as drafts need a toggle to make them live in the
catalog (active) or pull them off (archived). Wire this into
vendor/inventory.tsx on each product row.

+-----------------------------------------------------------------------+
| **🔗 API**                                                            |
|                                                                       |
| PATCH /products/:id { status: \'active\' \| \'archived\' } → 200 {    |
| product }                                                             |
+-----------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| // vendor/inventory.tsx --- ADD to each product row                   |
|                                                                       |
| import { useMutation, useQueryClient } from                           |
| \'@tanstack/react-query\';                                            |
|                                                                       |
| import { apiClient } from \'../../src/lib/apiClient\';                |
|                                                                       |
| function ProductRow({ product }: { product: any }) {                  |
|                                                                       |
| const qc = useQueryClient();                                          |
|                                                                       |
| const toggleMutation = useMutation({                                  |
|                                                                       |
| mutationFn: () =\> apiClient.patch(\`/products/\${product.id}\`, {    |
|                                                                       |
| status: product.status === \'active\' ? \'archived\' : \'active\',    |
|                                                                       |
| }),                                                                   |
|                                                                       |
| onSuccess: () =\> qc.invalidateQueries({ queryKey:                    |
| \[\'vendor-products\'\] }),                                           |
|                                                                       |
| });                                                                   |
|                                                                       |
| const isActive = product.status === \'active\';                       |
|                                                                       |
| return (                                                              |
|                                                                       |
| \<View className=\'flex-row items-center py-3 px-4 border-b           |
| border-white/5\'\>                                                    |
|                                                                       |
| {/\* Product image \*/}                                               |
|                                                                       |
| \<Image                                                               |
|                                                                       |
| source={{ uri: product.primary_image_url }}                           |
|                                                                       |
| className=\'w-14 h-14 rounded-xl mr-3\'                               |
|                                                                       |
| /\>                                                                   |
|                                                                       |
| {/\* Name + price \*/}                                                |
|                                                                       |
| \<View className=\'flex-1\'\>                                         |
|                                                                       |
| \<Text style={{ fontFamily: \'HelveticaNeue-Medium\' }}               |
|                                                                       |
| className=\'text-white\' numberOfLines={1}\>                          |
|                                                                       |
| {product.name}                                                        |
|                                                                       |
| \</Text\>                                                             |
|                                                                       |
| \<Text style={{ fontFamily: \'HelveticaNeue-Light\' }}                |
|                                                                       |
| className=\'text-\[#FF6B35\] text-sm\'\>                              |
|                                                                       |
| PKR {product.price}                                                   |
|                                                                       |
| \</Text\>                                                             |
|                                                                       |
| \<Text className=\'text-white/40 text-xs\'\>                          |
|                                                                       |
| Stock: {product.stock_quantity}                                       |
|                                                                       |
| \</Text\>                                                             |
|                                                                       |
| \</View\>                                                             |
|                                                                       |
| {/\* Active / Draft toggle \*/}                                       |
|                                                                       |
| \<TouchableOpacity                                                    |
|                                                                       |
| onPress={() =\> toggleMutation.mutate()}                              |
|                                                                       |
| disabled={toggleMutation.isPending}                                   |
|                                                                       |
| className={\`px-3 py-1 rounded-full border \${ isActive               |
|                                                                       |
| ? \'border-green-500/50 bg-green-500/10\'                             |
|                                                                       |
| : \'border-white/20 bg-white/5\' }\`}                                 |
|                                                                       |
| \>                                                                    |
|                                                                       |
| \<Text                                                                |
|                                                                       |
| style={{ fontFamily: \'HelveticaNeue-Medium\' }}                      |
|                                                                       |
| className={\`text-xs \${ isActive ? \'text-green-400\' :              |
| \'text-white/40\' }\`}                                                |
|                                                                       |
| \>                                                                    |
|                                                                       |
| {toggleMutation.isPending ? \'\...\' : isActive ? \'Active\' :        |
| \'Draft\'}                                                            |
|                                                                       |
| \</Text\>                                                             |
|                                                                       |
| \</TouchableOpacity\>                                                 |
|                                                                       |
| \</View\>                                                             |
|                                                                       |
| );                                                                    |
|                                                                       |
| }                                                                     |
+-----------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| **✅ Task 7 Done When:**                                              |
|                                                                       |
| ☑ Each product row shows \'Active\' (green) or \'Draft\' (grey)       |
| status pill                                                           |
|                                                                       |
| ☑ Tapping the pill toggles the status instantly                       |
|                                                                       |
| ☑ Active products appear in GET /products catalog. Draft products do  |
| not.                                                                  |
+-----------------------------------------------------------------------+

**All 7 Done --- Move to Testing**

  -------- ------------------------------------- ------------------------------
  **\#**   **Task**                              **Status**

  **1**    Delete Post --- trash icon on own     ☐ Done
           posts only, confirmation alert, feed  
           invalidated                           

  **2**    Report Post --- 3-dot menu on all     ☐ Done
           posts, reason picker, success state   

  **3**    Outfit List --- Outfits tab in        ☐ Done
           wardrobe.tsx, 2-column grid, empty    
           state with CTA                        

  **4**    Outfit Detail --- all items, AI       ☐ Done
           rating, delete wired                  

  **5**    Outfit Edit --- pre-filled form, item ☐ Done
           selection, save updates correctly     

  **6**    Product Creation ---                  ☐ Done
           name/category/price required, images, 
           draft + publish flow                  

  **7**    Product Toggle --- Active/Draft pill  ☐ Done
           in inventory rows, instant toggle     
  -------- ------------------------------------- ------------------------------

**All 7 complete → move to Testing Phase**
