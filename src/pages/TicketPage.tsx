import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TicketDetail } from '../components/TicketDetail';
import { UserTicketView } from '../components/UserTicketView';
import { Group, User } from '../types';
import { Loader2 } from 'lucide-react';

export const TicketPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [groups, setGroups] = useState<Group[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('nexus_user');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    } else {
      navigate('/login');
    }

    const fetchGroups = async () => {
      try {
        const res = await fetch('/api/groups');
        const data = await res.json();
        setGroups(data);
      } catch (err) {
        console.error('Failed to fetch groups', err);
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, [navigate]);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-[#0b1220]">
        <Loader2 className="animate-spin text-indigo-600" size={48} />
      </div>
    );
  }

  if (!id) return null;

  const isAgentOrAdmin = currentUser && (currentUser.role === 'Admin' || currentUser.role === 'Agent' || currentUser.role === 'Worker');

  return (
    <div className="h-screen bg-slate-50 dark:bg-[#0b1220] overflow-hidden flex flex-col transition-colors">
      {isAgentOrAdmin ? (
        <TicketDetail 
          ticketId={id} 
          groups={groups} 
          currentUser={currentUser} 
          onClose={() => navigate(-1)} 
          onUpdate={() => {}} 
        />
      ) : (
        <UserTicketView 
          ticketId={id} 
          currentUser={currentUser} 
          onClose={() => navigate(-1)} 
        />
      )}
    </div>
  );
};
