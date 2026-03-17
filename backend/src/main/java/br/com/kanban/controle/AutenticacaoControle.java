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

    @GetMapping("/cadastro")
    public String cadastroPagina() {
        return "cadastro";
    }

    @PostMapping("/cadastro")
    public String cadastrar(@RequestParam("nome") String nome, 
                            @RequestParam("usuario") String usuario, 
                            @RequestParam("senha") String senha, 
                            @RequestParam(value = "tipo", defaultValue = "ADMIN") String tipo) {
        br.com.kanban.entidade.Membro novo = new br.com.kanban.entidade.Membro();
        novo.setNome(nome);
        novo.setUsuario(usuario);
        novo.setSenha(senha);
        novo.setTipo(tipo);
        membroServico.salvar(novo);
        return "redirect:/login";
    }

    @PostMapping("/login")
    public String login(@RequestParam("usuario") String usuario, @RequestParam("senha") String senha, HttpSession session, Model model) {
        // Tenta buscar no banco primeiro
        return membroServico.buscarPorUsuario(usuario)
                .filter(m -> m.getSenha().equals(senha))
                .map(m -> {
                    session.setAttribute("usuarioLogado", m.getUsuario());
                    String perfil = (m.getTipo() != null) ? m.getTipo().toUpperCase() : "MEMBRO";
                    session.setAttribute("perfil", perfil);
                    
                    if ("ADMIN".equals(perfil)) {
                        return "redirect:/admin/tarefas";
                    } else {
                        session.setAttribute("membroId", m.getId());
                        return "redirect:/membro/tarefas";
                    }
                })
                .orElseGet(() -> {
                    // Fallback para admin hardcoded caso deseje manter
                    if ("tiagoffa".equals(usuario) && "ffa2026".equals(senha)) {
                        session.setAttribute("usuarioLogado", "tiagoffa");
                        session.setAttribute("perfil", "ADMIN");
                        return "redirect:/admin/tarefas";
                    }
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
