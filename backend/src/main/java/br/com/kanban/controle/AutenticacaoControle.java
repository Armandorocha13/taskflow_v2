package br.com.kanban.controle;

import br.com.kanban.servico.MembroServico;
import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

@Controller
@RequestMapping("/")
public class AutenticacaoControle {

    private final MembroServico membroServico;

    public AutenticacaoControle(MembroServico membroServico) {
        this.membroServico = membroServico;
    }

    @GetMapping("/")
    public String index() {
        return "redirect:/login";
    }

    @GetMapping("/login")
    public String loginPagina() {
        return "login";
    }

    @PostMapping("/login")
    public String login(@RequestParam("usuario") String usuario, @RequestParam("senha") String senha, HttpSession session, Model model) {
        if ("tiagoffa".equals(usuario) && "ffa2026".equals(senha)) {
            session.setAttribute("usuarioLogado", "tiagoffa");
            session.setAttribute("perfil", "ADMIN");
            return "redirect:/admin/tarefas";
        }

        return membroServico.buscarPorUsuario(usuario)
                .filter(m -> m.getSenha().equals(senha))
                .map(m -> {
                    session.setAttribute("usuarioLogado", m.getUsuario());
                    session.setAttribute("perfil", "MEMBRO");
                    session.setAttribute("membroId", m.getId());
                    return "redirect:/membro/tarefas";
                })
                .orElseGet(() -> {
                    model.addAttribute("erro", "Usuário ou senha inválidos");
                    return "login";
                });
    }

    @GetMapping("/logout")
    public String logout(HttpSession session) {
        session.invalidate();
        return "redirect:/login";
    }
}
