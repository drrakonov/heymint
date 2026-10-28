import { Check, ArrowLeft, UserRound } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useAvatarStore } from "@/store/avatarStore";
import { avatarList } from "@/lib/constants";
import { useUserStore } from "@/store/userStore";
import api from "@/lib/axios";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import toast from "react-hot-toast";
import PageHeader from "../workspace/PageHeader";

export default function Profileupdate() {
  const {activeAvatarIndex,setActiveAvatar}=useAvatarStore();
  const {user,setUser}=useUserStore();
  const [avatar,setAvatar]=useState(activeAvatarIndex);
  const [name,setName]=useState(user?.name || '');
  const [saving,setSaving]=useState(false);
  const navigate=useNavigate();
  const save=async(e:React.FormEvent)=>{e.preventDefault();if(!user||saving)return;const value=name.trim();if(value.length<3||value.length>20){toast.error('Use a name between 3 and 20 characters');return;}setSaving(true);try{const res=await api.post('/api/user/update-user',{id:user.id,newName:value});if(!res.data.success)throw new Error('Update failed');setUser({...user,name:value});setActiveAvatar(avatar);toast.success('Profile updated');navigate('/dashboard/profile');}catch{toast.error('Could not save your profile. Please try again.');}finally{setSaving(false);}};
  return <div className="page-shell"><PageHeader eyebrow="Your account" title="A little more you." description="Choose how you appear in your HeyMint workspace." action={<Link to="/dashboard/profile" className="workspace-action glass-control"><ArrowLeft size={14}/> Back to profile</Link>}/><div className="grid items-start gap-6 lg:grid-cols-[1.5fr_1fr]"><form onSubmit={save} className="workspace-panel"><div className="panel-heading"><h2>Edit profile</h2><UserRound size={17} className="text-text-secondary"/></div><div className="space-y-7 p-6"><div><h3 className="text-sm font-medium">Choose an avatar</h3><p className="mt-1 text-xs leading-5 text-text-secondary">For this browser session. Your meeting identity uses your display name.</p><div className="mt-4 flex flex-wrap gap-3">{avatarList.map((src,index)=><button key={src} type="button" aria-label={`Choose avatar ${index+1}`} aria-pressed={avatar===index} onClick={()=>setAvatar(index)} className={`relative rounded-2xl border p-2 transition ${avatar===index?'border-primary/50 bg-primary/10':'border-white/10 bg-white/[.02] hover:bg-white/5'}`}><Avatar className="h-11 w-11"><AvatarImage src={src}/><AvatarFallback>{index+1}</AvatarFallback></Avatar>{avatar===index&&<Check size={13} className="absolute -right-1 -top-1 rounded-full bg-primary p-0.5 text-black"/>}</button>)}</div></div><div><label htmlFor="display-name" className="text-sm font-medium">Display name</label><input id="display-name" className="glass-input mt-2 w-full px-4 py-3 text-sm" value={name} onChange={e=>setName(e.target.value)} minLength={3} maxLength={20} required autoComplete="name"/><div className="mt-2 flex justify-between text-xs text-text-secondary"><span>3–20 characters</span><span>{name.length}/20</span></div></div><div className="flex flex-wrap gap-3 border-t border-white/8 pt-5"><button type="submit" disabled={saving} className="workspace-action mint-button disabled:opacity-50">{saving?'Saving…':'Save changes'}</button><Link to="/dashboard/profile" className="workspace-action glass-control">Cancel</Link></div></div></form><aside className="workspace-panel p-6"><p className="eyebrow">Profile preview</p><div className="my-7 flex flex-col items-center text-center"><Avatar className="h-24 w-24 rounded-3xl border border-primary/20 bg-primary/5"><AvatarImage src={avatarList[avatar]}/><AvatarFallback>{name.charAt(0)}</AvatarFallback></Avatar><h2 className="mt-5 max-w-full break-words text-xl font-semibold">{name.trim()||'Your name'}</h2><p className="mt-2 max-w-full break-all text-xs text-text-secondary">{user?.email}</p></div><p className="border-t border-white/8 pt-4 text-xs leading-5 text-text-secondary">Your display name helps people recognize you in a meeting.</p></aside></div></div>;
}
